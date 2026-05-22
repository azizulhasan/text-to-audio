const gulp = require('gulp');
const eslint = require('gulp-eslint');
const babel = require('gulp-babel');
const prettify = require('gulp-js-prettify');
const uglify = require('gulp-uglify');
const concat = require('gulp-concat');
const beautify = require('gulp-beautify');
const rename = require('gulp-rename');
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');
const minifyCSS = require('gulp-clean-css');
const autoprefixer = require('gulp-autoprefixer');
const wpPot = require('gulp-wp-pot');
const zip = require('gulp-zip');
const notify = require('gulp-notify');
const checktextdomain = require('gulp-checktextdomain');
// var env = require('gulp-env');
// env({file: '.env.json'});
// const gutil = require('gutil');
// const ftp = require('vinyl-ftp');
const gulpCopy = require('gulp-copy');
// TTS-247: production ZIP excludes dev sources and build manifest. Source
// availability for wp.org review is satisfied by the public GitHub repo
// linked from README.txt (the GPLv3 tag for each release matches the ZIP).
const productionSrc = [
	'**/*',
	'!.git/**',
	'!.husky/**',
	'!node_modules/**',
	'!production/**',
	'!src/**',
	'!admin/js/tts/**',
	'!admin/js/blocks/**',
	'!freemius/**',
	'!admin/js/build/*.LICENSE.txt',
	'!admin/js/build/chunks/*.LICENSE.txt',
	'!.claude/**',
	'!languages/nul',
	'!scripts/**',
	'!sdk/**',
	'!plan/**',
	'!scripts/**/**',
	'!languages/*.po',
	'!admin/js/text-to-audio-dashboard.js',
	'!admin/js/text-to-audio-button.js',
	'!admin/js/TextToSpeech.js',
	'!admin/js/AtlasVoiceAnalytics.js',
	'!admin/js/AtlasVoicePlayerInsights.js',
	'!admin/js/build/text-to-audio-pro-button.min.js',
	'!admin/js/build/tts-bulk-mp3-file.min.js',
	'!admin/js/build/tts-bulk-mp3-file.min.js.LICENSE.txt',
	'!admin/js/build/tts-css-selectors.min.js',
	'!admin/js/build/tts-css-selectors.min.js.LICENSE.txt',
	'!admin/js/build/text-to-audio-pro-button.min.js.LICENSE.txt',
	'!admin/js/build/text-to-audio-dashboard-ui.min.js.LICENSE.txt',
	// TTS-249: exclude ALL Pro player demo assets from the wp.org ZIP. These are
	// premium-player previews (player2/player3/elevenlabs) and the plyr-demo bundle
	// carried a hardcoded cdn.openai.com sample URL (Guideline 6/8). They ship in
	// the Pro plugin, not the free distribution.
	'!admin/demos/**',
	'!.browserslistrc',
	'!.eslintrc',
	'!.gitignore',
	'!gulpfile.js',
	'!package.json',
	'!composer.json',
	'!composer.lock',
	'!phpcs.xml',
	'!.cpanel.yml',
	'!package-lock.json',
	'!mix-manifest.json',
	'!webpack.mix.js',
	'!uninstall.php',
	'!null',
	'!nul',
	'!languages/nul',
	'!*.md',
]


const config = {
	babel: {
		presets: ['@babel/preset-env']
	},
	prettify: {
		"indent_with_tabs": true
	},
	js: {
		src: ['admin/js/*.js', '!admin/js/**/*.min.js'],
		dist: 'admin/js/.',
	},
	css: {
		src: ['admin/css/*.css', '!*.min.css'],
		dist: 'admin/css/minify',
	},
	scss: {
		src: 'assets/scss/*.scss',
		dist: 'assets/css',
	},
	autoprefixer: {
		options: {
			cascade: false,
		},
	},
	pot: {
		src: '**/*.php',
		dist: 'languages/text-to-audio.pot',
		options: {
			domain: 'text-to-audio',
			package: 'Text To Audio',
			bugReport: '',
			headers: {
				'X-Domain': 'text-to-audio'
			}
		}
	},
	zip: {
		src: productionSrc,
		file_name: 'text-to-audio',
		dist: 'production',
		options: {
			compress: true,
			modifiedTime: undefined
		}
	},
	copy: {
		src: productionSrc,
		output: 'production/text-to-audio/',
		options: {
			//compress: true,
			//modifiedTime: undefined
		}
	},
	copyProButton: {
		src: [
			'admin/js/build/text-to-audio-pro-button.min.js'
		],
		output: 'D:/laragon/www/tts/wp-content/plugins/text-to-audio-pro/Assets/js/build/',
		options: {
			//compress: true,
			//modifiedTime: undefined
		}
	},
	// TTS-247: deploy the built plugin to the secondary local install at
	// D:/laragon/www/seven/wp-content/plugins/. Run `npm run copy:seven`
	// after `npm run makeZip` (or `npm run copy`) has refreshed
	// production/text-to-audio/.
	copyToSeven: {
		src: 'production/text-to-audio/**',
		output: 'D:/laragon/www/seven/wp-content/plugins/text-to-audio/',
		options: {}
	}

	// ftp:{
	// 	src: [
	// 		'index.php',
	// 		'uninstall.php',
	// 		'woo-invoice.php',
	// 		'LICENSE.txt',
	// 		'README.txt',
	// 		'libs/**',
	// 		'admin/**',
	// 		'includes/**',
	// 		'languages/**',
	// 		'!admin/css/flatpickr.css',
	// 		'!admin/css/selectize.css',
	// 		'!admin/css/selectize.default.css',
	// 		'!admin/css/slick.css',
	// 		'!admin/css/slick-theme.css',
	// 		'!admin/css/webappick-boilerplate-admin.css',
	// 		'!admin/css/webappick-pdf-invoice-for-woocommerce-admin.css'
	// 	],
	// 	options: {
	// 		host: process.env.FTP_HOST,
	// 		port: process.env.FTP_PORT,
	// 		user: process.env.FTP_USER,
	// 		password: process.env.FTP_PASSWORD,
	// 		log: gutil.log,
	// 		parallel: 9,
	// 		maxConnections:9,
	// 	},
	// 	base: process.env.FTP_DEPLOYPATH,
	// 	folder: process.env.FTP_DEPLOYFOLDER
	// }
};

// Tasks
gulp.task(
	'compile:js',
	() => {
		return gulp.src(config.js.src)
			.pipe(sourcemaps.init({ largeFile: true, loadMaps: true }))
			.pipe(eslint.format())
			.pipe(eslint())
			.pipe(babel(config.babel))
			.on('error', notify.onError({ title: "Error", message: "Error: <%= error.message %>" })) // phpcs:ignore WordPressVIPMinimum.Security.Underscorejs.OutputNotation
			.pipe(uglify())
			.pipe(rename({ suffix: '.min' }))
			.pipe(sourcemaps.write())
			.pipe(gulp.dest(config.js.dist))
			.pipe(notify({ message: 'TASK: compile:js Completed! 💯', onLast: true }));
	}
);
// minify:css
gulp.task(
	'minify:css',
	() => {
		return gulp.src(config.css.src)
			.pipe(minifyCSS({ compatibility: 'ie8' }))
			.pipe(autoprefixer('last 2 version', 'safari 5', 'ie 8', 'ie 9'))
			.pipe(rename({ suffix: '.min' }))
			.pipe(gulp.dest(config.css.dist));
	}
);
// compile:scss
gulp.task(
	'compile:scss',
	() => {
		return gulp.src(config.scss.src)
			.pipe(sass().on('error', sass.logError))
			.on('error', notify.onError({ title: "Error", message: "Error: <%= error.message %>" })) // phpcs:ignore WordPressVIPMinimum.Security.Underscorejs.OutputNotation
			.pipe(sourcemaps.init())
			.pipe(autoprefixer(config.autoprefixer.options))
			.pipe(beautify.js({ indent_size: 4 }))
			.pipe(sourcemaps.write('.'))
			.pipe(gulp.dest(config.scss.dist))
			.pipe(minifyCSS())
			.pipe(rename({ suffix: '.min' }))
			.pipe(gulp.dest(config.scss.dist))
			.pipe(notify({ message: 'TASK: compile:scss Completed! 💯', onLast: true }));
	}
);
//makePot
gulp.task(
	'makePot',
	() => {
		return gulp.src(config.pot.src)
			.pipe(wpPot(config.pot.options))
			.on('error', notify.onError({ title: "Error", message: "Error: <%= error.message %>" })) // phpcs:ignore WordPressVIPMinimum.Security.Underscorejs.OutputNotation
			.pipe(gulp.dest(config.pot.dist))
			.pipe(notify({ message: 'TASK: makePot Completed! 💯', onLast: true }));
	}
);

// makeZip
gulp.task(
	'makeZip',
	function () {
		return gulp.series('copy', 'zip')()
	}
);

gulp.task('zip', function () {
	return gulp.src('production/**')
		.pipe(zip(config.zip.file_name.replace('.zip', '') + '.zip'), config.zip.options)
		.pipe(gulp.dest(config.zip.dist))
		.pipe(notify({ message: 'Zipping Completed! 💯', onLast: true }))
})


gulp.task('copy', function () {
	return gulp.src(config.copy.src)
		.pipe(gulpCopy(config.copy.output, config.copy.src.options))
		.pipe(notify({ message: 'Copy Completed! 💯', onLast: true }))

})

// Copy pro button
//
// gulp-copy preserves the source folder structure under the output dir, so the
// previous gulpCopy(...) wrote to <output>/admin/js/build/<file>.min.js instead
// of dropping the file directly in <output>. The Pro plugin loads from
// <output>/<file>.min.js, so the bundle was never actually updated.
// gulp.dest with no glob base writes the file straight into the output dir.
gulp.task('copyProButton', function () {
	return gulp.src(config.copyProButton.src)
		.pipe(gulp.dest(config.copyProButton.output))
		.pipe(notify({ message: 'Copy Completed! 💯', onLast: true }))
})

gulp.task('release', function () {
	return gulp.src('production/text-to-audio/**')
		.pipe(gulpCopy('D:/xampp/htdocs/wordpress.org/text-to-audio-release/', config.copy.src.options))
		.pipe(notify({ message: 'Release version copy Completed! 💯', onLast: true }))
})

// TTS-247: internal deploy step — copy the already-built
// production/text-to-audio/ tree to the secondary local WP install at
// D:/laragon/www/seven/wp-content/plugins/. Strips the leading
// "production/text-to-audio/" path segments so the files land directly
// under the target plugin folder.
gulp.task('copyToSevenDeploy', function () {
	return gulp.src(config.copyToSeven.src)
		.pipe(gulpCopy(config.copyToSeven.output, { prefix: 2 }))
		.pipe(notify({ message: 'Copied to seven/wp-content/plugins/text-to-audio/ 💯', onLast: true }))
})

// Public task — refresh the production/ build and deploy it in one command
// (npm run copy:seven). Mirrors the makeZip = copy + zip pattern.
gulp.task('copyToSeven', gulp.series('copy', 'copyToSevenDeploy'))

// watch
gulp.task(
	'watch',
	function () {
		gulp.watch(config.css.src, gulp.series('minify:css'));
	}
);
// checktextdomain
gulp.task('checktextdomain', function () {
	return gulp
		.src('**/*.php')
		.pipe(checktextdomain({
			text_domain: 'text-to-audio', //Specify allowed domain(s)
			keywords: [ //List keyword specifications
				'__:1,2d',
				'_e:1,2d',
				'_x:1,2c,3d',
				'esc_html__:1,2d',
				'esc_html_e:1,2d',
				'esc_html_x:1,2c,3d',
				'esc_attr__:1,2d',
				'esc_attr_e:1,2d',
				'esc_attr_x:1,2c,3d',
				'_ex:1,2c,3d',
				'_n:1,2,4d',
				'_nx:1,2,4c,5d',
				'_n_noop:1,2,3d',
				'_nx_noop:1,2,3c,4d'
			],
		}));
});

// build
gulp.task('build', gulp.series('minify:css', 'compile:js', 'makeZip'));


// gulp.task('deploy',  function(){
// 	let conn = ftp.create(config.ftp.options);
// 	return gulp.src(config.ftp.src, {base: '.', buffer: false})
// 		.pipe(conn.newer(config.ftp.folder))
// 		.pipe(conn.dest(config.ftp.folder))
// 		.pipe( notify( {message: 'File Upload Completed! 💯', onLast: true} ) );
// });