import EditorSelectors from '../../selectors/editor-selectors';
import { expect } from '@playwright/test';
const EditorPage = require( '../editor-page' );
const path = require( 'path' );

export default class Content {
	constructor( page, testInfo ) {
		this.page = page;
		this.editorPage = new EditorPage( this.page, testInfo );
	}

	async selectLinkSource( option ) {
		await this.page.locator( EditorSelectors.image.linkSelect ).selectOption( option );
	}

	async setLink( link,
		options = { targetBlank: false, noFollow: false, customAttributes: undefined, linkTo: false, linkInpSelector } ) {
		if ( options.linkTo ) {
			await this.selectLinkSource( 'Custom URL' );
		}

		const urlInput = this.page.locator( options.linkInpSelector ).first();
		await urlInput.clear();
		await urlInput.type( link );

		const wheel = this.page.locator( EditorSelectors.button.linkOptions ).first();
		if ( await wheel.isVisible() ) {
			await wheel.click();
		}

		if ( options.targetBlank ) {
			await this.page.locator( EditorSelectors.button.targetBlankChbox ).first().check();
		}

		if ( options.noFollow ) {
			await this.page.locator( EditorSelectors.button.noFollowChbox ).first().check();
		}
		if ( options.customAttributes ) {
			await this.page.locator( EditorSelectors.button.customAttributesInp ).first().type( `${ options.customAttributes.key }|${ options.customAttributes.value }` );
		}
		await this.editorPage.getPreviewFrame().locator( EditorSelectors.siteTitle ).click();
	}

	/**
	 * @description Function verifies link ("a" HTML tag) attributes with expected values
	 * @param {*}      element                  "a" HTML tag that contains link attributes
	 * @param {Object} options
	 * @param {*}      options.target           link target attribute
	 * @param {string} options.href             link href attribute
	 * @param {string} options.rel              link rel attribute
	 * @param {string} options.customAttributes link custom attribute: key|value
	 * @param {string} options.widget           widget name where we test link attributes
	 */
	async verifyLink( element, options = { target, href, rel, customAttributes, widget } ) {
		await expect( element ).toHaveAttribute( 'target', options.target );
		await expect( element ).toHaveAttribute( 'href', options.href );
		await expect( element ).toHaveAttribute( 'rel', options.rel );
		if ( options.widget !== 'text-path' ) {
			await expect( element ).toHaveAttribute( options.customAttributes.key, options.customAttributes.value );
		}
	}

	async chooseImage( imageTitle ) {
		await this.page.locator( EditorSelectors.media.preview ).click();
		await this.page.getByRole( 'tab', { name: 'Media Library' } ).click();
		await this.page.locator( EditorSelectors.media.imageByTitle( imageTitle ) ).click();
		await this.page.locator( EditorSelectors.media.selectBtn ).click();
	}

	async selectImageSize( args = { widget, select, imageSize } ) {
		await this.editorPage.getPreviewFrame().locator( args.widget ).click();
		await this.page.locator( args.select ).selectOption( args.imageSize );
		await this.editorPage.getPreviewFrame().locator( EditorSelectors.pageTitle ).click();
	}

	async verifyImageSrc( args = { selector, imageTitle, isPublished, isVideo } ) {
		const image = args.isPublished
			? await this.page.locator( args.selector )
			: await this.editorPage.getPreviewFrame().waitForSelector( args.selector );
		const attribute = args.isVideo ? 'style' : 'src';
		const src = await image.getAttribute( attribute );
		const regex = new RegExp( args.imageTitle );
		expect( regex.test( src ) ).toEqual( true );
	}

	async setCustomImageSize( args = { selector, select, imageTitle, width, height } ) {
		await this.editorPage.getPreviewFrame().locator( args.selector ).click();
		await this.page.locator( args.select ).selectOption( 'custom' );
		await this.page.locator( EditorSelectors.image.widthInp ).type( args.width );
		await this.page.locator( EditorSelectors.image.heightInp ).type( args.height );
		const regex = new RegExp( `http://(.*)/wp-content/uploads/elementor/thumbs/${ args.imageTitle }(.*)` );
		const response = this.page.waitForResponse( regex );
		await this.page.getByRole( 'button', { name: 'Apply' } ).click();
		await response;
	}

	async setCaption( option ) {
		await this.page.getByRole( 'combobox', { name: 'Caption' } ).selectOption( option );
	}

	async setLightBox( option ) {
		await this.page.getByRole( 'combobox', { name: 'Lightbox' } ).selectOption( option );
		await this.editorPage.getPreviewFrame().locator( EditorSelectors.siteTitle ).click();
	}

	async toggleControls( controlSelectors ) {
		for ( const i in controlSelectors ) {
			await this.page.locator( controlSelectors[ i ] )
				.locator( '..' )
				.locator( EditorSelectors.video.switch ).click();
		}
	}

	async uploadSVG( options = { icon: undefined, widget: undefined } ) {
		const _icon = options.icon === undefined ? 'test-svg-wide' : options.icon;
		if ( 'text-path' === options.widget ) {
			await this.page.locator( EditorSelectors.plusIcon ).click();
		} else {
			await this.page.getByRole( 'button', { name: 'Content' } ).click();
			const mediaUploadControl = this.page.locator( EditorSelectors.media.preview ).first();
			await mediaUploadControl.hover();
			await mediaUploadControl.waitFor();
			await this.page.getByText( 'Upload SVG' ).first().click();
		}
		const regex = new RegExp( _icon );
		const response = this.page.waitForResponse( regex );
		await this.page.setInputFiles( EditorSelectors.media.imageInp, path.resolve( __dirname, `../../resources/${ _icon }.svg` ) );
		await response;
		await this.page.getByRole( 'button', { name: 'Insert Media' } )
			.or( this.page.getByRole( 'button', { name: 'Select' } ) ).nth( 1 ).click();
	}

	async addNewTab( tabName, text ) {
		const itemCount = await this.page.locator( EditorSelectors.item ).count();
		await this.page.getByRole( 'button', { name: 'Add Item' } ).click();
		await this.page.getByRole( 'textbox', { name: 'Title' } ).click();
		await this.page.getByRole( 'textbox', { name: 'Title' } ).fill( tabName );
		const textEditor = this.page.frameLocator( EditorSelectors.tabs.textEditorIframe ).nth( itemCount );
		await textEditor.locator( 'html' ).click();
		await textEditor.getByText( 'Tab Content' ).click();
		await textEditor.locator( EditorSelectors.tabs.body ).fill( text );
	}

	/**
	 * @description This function parses link ("a" tag) src attribute and gets Query Params and their values.
	 * The same as you copy src attribute value and put in Postman
	 * @param {string} src
	 * @return {Object} options: parsed query params with key|value
	 */
	parseSrc( src ) {
		const options = src.split( '?' )[ 1 ].split( '&' ).reduce( ( acc, cur ) => {
			const [ key, value ] = cur.split( '=' );
			acc[ key ] = value;
			return acc;
		}, {} );
		return options;
	}

	async verifySrcParams( src, expectedValues, player ) {
		const videoOptions = this.parseSrc( src );
		if ( 'vimeo' === player ) {
			videoOptions.start = src.split( '#' )[ 1 ];
		}
		for ( const key in expectedValues ) {
			expect( videoOptions[ key ], { message: `Parameter is ${ key }` } ).toEqual( String( expectedValues[ key ] ) );
		}
	}
}
