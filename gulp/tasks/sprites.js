const gulp = require('gulp');
const svgSprite = require('gulp-svg-sprite');
const svgComponentEjs = require('./plugins/gulp-sprite-component-ejs');
// const svgEjs = require('./plugins/gulp-sprite-ejs');
const svg2png = require('gulp-svg2png');
const rename = require('gulp-rename');
const del = require('del');

const config = {
  mode: {
    css: {
      variables: {
        replaceSvgWithPng: () =>
          (sprite, render) =>
            render(sprite).split('.svg').join('.png') },
      sprite: 'sprite.svg',
      render: {
        css: {
          template: './gulp/templates/sprite.css',
        },
      },
    },
  },
};

gulp.task('beginClean', () =>
  del(['./app/temp', './app/build/images/sprites'])
);

gulp.task('createSprite', ['beginClean'], () =>
  gulp.src('./app/assets/icons/**/*.svg')
    .pipe(svgSprite(config))
    .pipe(gulp.dest('./app/temp/sprite/'))
);

gulp.task('createSvgComponents', ['createSprite'], () =>
  gulp.src('./app/temp/sprite/css/sprite*.svg')
    .pipe(svgComponentEjs())
    .pipe(gulp.dest('./app/assets/scripts/components/'))
);

// gulp.task('createSvgEjs', ['createSprite'], () =>
//   gulp.src('./app/temp/sprite/css/sprite*.svg')
//     .pipe(svgEjs())
//     .pipe(rename('_embedSprite.ejs'))
//     .pipe(gulp.dest('./app/assets/templates/modules'))
// );

gulp.task('createPngCopy', ['createSprite'], () =>
  gulp.src('./app/temp/sprite/css/*.svg')
    .pipe(svg2png())
    .pipe(gulp.dest('./app/temp/sprite/css'))
);

gulp.task('copySpriteCSS', ['createSprite'], () =>
  gulp.src('./app/temp/sprite/css/*.css')
    .pipe(rename('_sprite.css'))
    .pipe(gulp.dest('./app/assets/styles/modules'))
);

gulp.task('copySpriteGraphic', ['createPngCopy'], () =>
  gulp.src('./app/temp/sprite/css/**/*.{svg,png}')
    .pipe(gulp.dest('./app/build/images/sprites'))
);

gulp.task('endClean', ['copySpriteGraphic', 'copySpriteCSS'], () =>
  del(['./app/temp'])
);

gulp.task('icons', ['beginClean', 'createSprite', 'createSvgComponents', 'createPngCopy', 'copySpriteGraphic', 'copySpriteCSS', 'endClean']);
