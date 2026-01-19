import { registerBlockType } from '@wordpress/blocks';

// Customize button
import customizeButton from './customize-button/customize-button';

let blocks = [customizeButton];

// Register blocks.
blocks.map((block) => {
	registerBlockType(block.namespace, block.object);
});
