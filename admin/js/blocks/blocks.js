// Customize button
import customizeButton from './customize-button/customize-button';

// webappick.
import webappick from './webappick/webappick';

let blocks = [customizeButton, webappick];

blocks.map((block) => {
	wp.blocks.registerBlockType(block.namespace, block.object);
});
