const gulp = require('gulp');
const watch = require('gulp-watch');
const browserSync = require('browser-sync').create();

gulp.task('watch', () => {
  browserSync.init({
    notify: false,
    server: {
      baseDir: "app/build",
      // index: "index.html"
    }
    // proxy: 'localhost:3002',
  });
  watch('./app/index.html', () =>
    browserSync.reload()
  );
  watch('./app/stylesheets/**/*.css', () =>
    gulp.start('cssInject')
  );
  watch('./app/client/**/*.js', () =>
    gulp.start('scriptsRefresh')
  );
});


gulp.task('cssInject', ['styles'], () =>
  gulp.src('./app/build/styles.css')
    .pipe(browserSync.stream())
);

gulp.task('scriptsRefresh', ['scripts'], () =>
  browserSync.reload()
);
