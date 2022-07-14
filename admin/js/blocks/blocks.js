import customizeButton from './customize-button/customize-button';

let blocks = [customizeButton];

blocks.map((block) => {
	wp.blocks.registerBlockType(block.namespace, block.object);
});
