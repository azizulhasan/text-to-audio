// Customize button
import customizeButton from './customize-button/customize-button';

let blocks = [customizeButton];

// Register blocks.
blocks.map((block) => {
	wp.blocks.registerBlockType(block.namespace, block.object);
});
