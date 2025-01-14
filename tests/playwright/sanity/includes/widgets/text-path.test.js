import { test, expect } from '@playwright/test';
import WpAdminPage from '../../../pages/wp-admin-page.js';
const EditorPage = require( '../../../pages/editor-page.js' );
import Content from '../../../pages/elementor-panel-tabs/content.js';
import EditorSelectors from '../../../selectors/editor-selectors.js';

test( 'Custom path type', async ( { page }, testInfo ) => {
	const wpAdmin = new WpAdminPage( page, testInfo );
	const editor = new EditorPage( page, testInfo );
	const contentTab = new Content( page, testInfo );
	await wpAdmin.enableAdvancedUploads();
	await wpAdmin.openNewPage();
	await editor.closeNavigatorIfOpen();
	await editor.addWidget( 'text-path' );
	await page.getByRole( 'combobox', { name: 'Path Type' } ).selectOption( 'custom' );
	await contentTab.uploadSVG( { widget: 'text-path' } );
	await expect( editor.getPreviewFrame().locator( EditorSelectors.textPath.svgIcon ) ).toBeVisible();
	await editor.publishAndViewPage();
	await expect( page.locator( EditorSelectors.textPath.svgIcon ) ).toBeVisible();
} );
