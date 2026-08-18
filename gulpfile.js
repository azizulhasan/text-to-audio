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
	// The plugin enqueues admin/css/minify/*.min.css, so only those ship — the
	// unminified sources stay in the repo for development. Minifying the one
	// front-end stylesheet (text-to-audio-button.css) cuts 16 KB to 9.7 KB on
	// every page view; minification does not affect the cascade, so core's
	// Additional CSS still overrides plugin styles as before.
	'!admin/css/*.css',
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
	'!docs/**',
	'!scripts/**/**',
	'!languages/*.po',
	'!admin/js/text-to-audio-dashboard.js',
	'!admin/js/text-to-audio-button.js',
	'!admin/js/TextToSpeech.js',
	'!admin/js/AtlasVoiceAnalytics.js',
	'!admin/js/AtlasVoicePlayerInsights.js',
	'!admin/js/build/text-to-audio-pro-button.min.js',
	'!admin/js/build/tts-bulk-mp3-file-ui.min.js',
	'!admin/js/build/tts-bulk-mp3-file-ui.min.js.LICENSE.txt',
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
		// TTS-238 D27.20 — also sync the css-selectors bundle to the
		// Pro plugin's Assets folder so the per-post metabox doesn't
		// load a stale copy when TTA_DEBUG_MODE is off.
		src: [
			'admin/js/build/text-to-audio-pro-button.min.js',
			'admin/js/build/tts-css-selectors.min.js',
			'admin/js/build/tts-css-selectors.min.js.LICENSE.txt'
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
	},

	// TTS-267: local wp.org SVN working copy, used by `npm run release`
	// (svn:sync / svn:stale). Override per run with --svn "<path>" or the
	// WPORG_SVN_DIR env var; both win over this default. The tasks refuse any
	// path lacking .svn + text-to-audio.php, so a wrong value here fails loudly
	// rather than mirroring over the wrong folder.
	wporgSvn: 'D:/xampp/htdocs/wordpress.org/text-to-audio'

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
// TTS-267: the series is still resolved lazily — clean:production, copy and
// zip are defined further down this file, so passing gulp.series(...) directly
// would throw "Task never defined" at registration time. What changed is that
// the callback is now handed to the series: the old form called it with no
// arguments and returned undefined, so gulp never learned when the task
// finished, printed "Did you forget to signal async completion?" and exited
// non-zero. Harmless when makeZip ran alone, but it broke `npm run release`
// (makeZip && svn:sync && svn:stale) at the first &&, and it made a genuine
// build failure look identical to a success.
gulp.task(
	'makeZip',
	function (done) {
		gulp.series('clean:production', 'copy', 'zip')(done)
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

// TTS-249: gulp-copy does NOT clean its destination, so files removed from
// `productionSrc` (e.g. admin/demos/**) would persist from earlier builds in
// production/text-to-audio/ — and therefore in the wp.org ZIP. Wipe the build
// output before each copy so excluded files actually leave the distribution.
gulp.task('clean:production', function (done) {
	const fs = require('fs');
	fs.rmSync('production/text-to-audio', { recursive: true, force: true });
	fs.rmSync('production/text-to-audio.zip', { force: true });
	done();
})

// TTS-267: shared helpers for the wp.org SVN release tasks below.
//
// A working copy is only a valid target if it carries BOTH .svn metadata and
// the plugin's main file. svn:sync deletes whatever it does not recognise, so
// a mistyped --svn path must fail loudly rather than mirror over someone's
// Documents folder.
const svnRelease = {
	buildRoot: 'production/text-to-audio',

	arg(name) {
		const i = process.argv.indexOf('--' + name);
		return i === -1 ? null : process.argv[i + 1];
	},

	// Relative file list for a tree, skipping SVN's own metadata.
	listing(root) {
		const fs = require('fs');
		const path = require('path');
		const found = [];
		const walk = (dir) => {
			for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
				if (entry.name === '.svn') {
					continue;
				}
				const full = path.join(dir, entry.name);
				if (entry.isDirectory()) {
					walk(full);
				} else {
					found.push(path.relative(root, full).split(path.sep).join('/'));
				}
			}
		};
		walk(root);
		return found;
	},

	// Returns the validated working-copy path, or throws with the reason.
	// Precedence: --svn flag, then WPORG_SVN_DIR env var, then config.wporgSvn
	// — so `npm run release` works with no arguments on this machine, and any
	// other checkout can override without editing the gulpfile.
	resolveTarget() {
		const fs = require('fs');
		const path = require('path');
		const svnRoot = this.arg('svn') || process.env.WPORG_SVN_DIR || config.wporgSvn;
		if (!svnRoot) {
			throw new Error('Set the working copy with --svn "<path>", the WPORG_SVN_DIR env var, or config.wporgSvn.');
		}
		if (!fs.existsSync(this.buildRoot)) {
			throw new Error('Run `npm run makeZip` first — ' + this.buildRoot + ' does not exist.');
		}
		if (!fs.existsSync(svnRoot)) {
			throw new Error('Not found: ' + svnRoot);
		}
		if (!fs.existsSync(path.join(svnRoot, '.svn'))) {
			throw new Error('Not an SVN working copy (no .svn): ' + svnRoot);
		}
		if (!fs.existsSync(path.join(svnRoot, 'text-to-audio.php'))) {
			throw new Error('Does not look like the text-to-audio working copy (no text-to-audio.php): ' + svnRoot);
		}
		return svnRoot;
	}
};

// TTS-267: mirror the release into the wp.org working copy.
//
// This REPLACES pasting production/text-to-audio/ over trunk by hand. Pasting
// only adds and overwrites, so files that disappear between releases — chiefly
// webpack's renamed code-split chunks — pile up forever; at 2.3.7 that was 49
// dead files (5.7 MB) being downloaded by every user. Mirroring makes the
// working copy exactly match the build, so those leave on their own.
//
// Deleted files are left on disk as SVN "missing" entries, which is what you
// want: TortoiseSVN's commit dialog lists them and commits them as deletions.
// No svn CLI needed.
//
//   npm run makeZip
//   gulp svn:sync --svn "D:/xampp/htdocs/wordpress.org/text-to-audio"
//   gulp svn:stale --svn "..."      (should report clean)
gulp.task('svn:sync', function (done) {
	const fs = require('fs');
	const path = require('path');

	let svnRoot;
	try {
		svnRoot = svnRelease.resolveTarget();
	} catch (err) {
		done(err);
		return;
	}

	const fresh = svnRelease.listing(svnRelease.buildRoot);
	const existing = svnRelease.listing(svnRoot);
	const freshSet = new Set(fresh);

	const removed = existing.filter((f) => !freshSet.has(f));
	removed.forEach((rel) => fs.rmSync(path.join(svnRoot, rel.split('/').join(path.sep)), { force: true }));

	let added = 0;
	let updated = 0;
	fresh.forEach((rel) => {
		const from = path.join(svnRelease.buildRoot, rel.split('/').join(path.sep));
		const to = path.join(svnRoot, rel.split('/').join(path.sep));
		const isNew = !fs.existsSync(to);
		fs.mkdirSync(path.dirname(to), { recursive: true });
		fs.copyFileSync(from, to);
		if (isNew) {
			added++;
		} else {
			updated++;
		}
	});

	console.log('svn:sync — ' + added + ' added, ' + updated + ' updated, ' + removed.length + ' removed.');
	if (added) {
		console.log('  Mark the ' + added + ' new file(s) as Add in the commit dialog.');
	}
	if (removed.length) {
		console.log('  The ' + removed.length + ' removed file(s) show as "missing" — tick them to commit the deletions.');
		removed.forEach((f) => console.log('    ' + f));
	}
	done();
})

// TTS-267: wp.org SVN stale-file audit.
//
// clean:production keeps the ZIP correct, but a wp.org release is done by
// PASTING production/text-to-audio/ over the SVN working copy — and pasting
// only adds and overwrites, it never deletes. Webpack renames its code-split
// chunks on every build, so trunk accumulates every hash ever shipped: at
// 2.3.7 the working copy held 60 files in admin/js/build/chunks (6.8 MB) where
// the release needs 11 (1.1 MB) — roughly 5.7 MB of dead JavaScript that every
// user had been downloading for several releases.
//
// Run AFTER `npm run makeZip`, before `svn commit`:
//   gulp svn:stale --svn "D:/xampp/htdocs/wordpress.org/text-to-audio"
//   gulp svn:stale --svn "..." --delete    (issues `svn delete` for each)
//
// Report-only by default — deleting from a working copy is not something a
// build script should do behind your back.
gulp.task('svn:stale', function (done) {
	const { execFileSync } = require('child_process');

	const shouldDelete = process.argv.includes('--delete');

	let svnRoot;
	try {
		svnRoot = svnRelease.resolveTarget();
	} catch (err) {
		done(err);
		return;
	}

	const fresh = new Set(svnRelease.listing(svnRelease.buildRoot));
	const stale = svnRelease.listing(svnRoot).filter((f) => !fresh.has(f)).sort();

	if (!stale.length) {
		console.log('svn:stale — working copy is clean, nothing to remove.');
		done();
		return;
	}

	console.log('svn:stale — ' + stale.length + ' file(s) in the working copy are not in this release:');
	stale.forEach((f) => console.log('  ' + f));

	if (!shouldDelete) {
		console.log('\nRe-run with --delete to `svn delete` them.');
		done();
		return;
	}

	try {
		// One call per file: paths can contain spaces, and a failure should name
		// the file that caused it rather than aborting an opaque batch.
		stale.forEach((f) => execFileSync('svn', ['delete', '--force', f], { cwd: svnRoot, stdio: 'inherit' }));
		console.log('\nDeleted ' + stale.length + ' file(s). Review with `svn status`, then commit.');
		done();
	} catch (err) {
		done(err);
	}
})

// Wipe the secondary "seven" install's plugin folder before deploying, so a
// clean copy lands there too (same stale-file reasoning as clean:production).
gulp.task('clean:seven', function (done) {
	const fs = require('fs');
	fs.rmSync(config.copyToSeven.output, { recursive: true, force: true });
	done();
})

// Copy pro button
//
// gulp-copy preserves the source folder structure under the output dir, so the
// previous gulpCopy(...) wrote to <output>/admin/js/build/<file>.min.js instead
// of dropping the file directly in <output>. The Pro plugin loads from
// <output>/<file>.min.js, so the bundle was never actually updated.
// gulp.dest with no glob base writes the file straight into the output dir.
// TTS-249 (T2): retired. The frontend pro-button (players 2..6) is no longer
// built by Free — the Pro plugin builds text-to-audio-pro-button.min.js from
// its own source. This copy task is kept as a no-op for backward reference.
gulp.task('copyProButton', function (done) {
	done();
})

// TTS-267: the old `release` task copied the build into
// wordpress.org/text-to-audio-release/ with gulp-copy, which only adds and
// overwrites — the same paste-never-delete pattern that let stale webpack
// chunks accumulate in the SVN working copy. Replaced by `npm run release`
// (makeZip → svn:sync → svn:stale), which mirrors into the working copy and
// verifies the result.

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
gulp.task('copyToSeven', gulp.series('clean:production', 'copy', 'clean:seven', 'copyToSevenDeploy'))

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