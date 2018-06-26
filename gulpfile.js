const project = require("./projectConfig.json");
const fs = require("fs");

const gulp = require("gulp");
const browserSync = require("browser-sync").create();
const sass = require("gulp-sass");
const plumber = require("gulp-plumber");
const postcss = require("gulp-postcss");
const autoprefixer = require("autoprefixer");
const minify = require("gulp-csso");
const rename = require("gulp-rename");
const imagemin = require("gulp-imagemin");
const webp = require("gulp-webp");
const svgstore = require("gulp-svgstore");
const run = require("run-sequence");
const del = require("del");
const babel = require("gulp-babel");
const concat = require("gulp-concat");
const uglifyJs = require("gulp-uglifyjs");
const pug = require("gulp-pug");
const htmlbeautify = require("gulp-html-beautify");
const data = require("gulp-data");
const path = require("path");
const merge = require("gulp-merge-json");

/* Директории: исходники и сборка */

const config = {
  src: "./src",
  build: "./build"
};

/* Сервер с отслеживанием изменений */

gulp.task("browserSync", function () {
  browserSync.init({
    server: config.build
  });

  gulp.watch(`${config.src}/**/*.{scss,sass}`, ["style"]);
  gulp.watch(`${config.src}/**/*.{pug,json}`, ["pug"]);
  gulp.watch(`${config.src}/js/**/*.js`, ["js"]);
  gulp.watch(`${config.build}/**/*.*`).on('change', browserSync.reload);
});

/* Сборка стилей и минификация */

gulp.task("style", function () {
  return gulp.src(`${config.src}/scss/style.scss`)
    .pipe(plumber())
    .pipe(sass({
      outputStyle: 'expanded'
    }))
    .pipe(postcss([
      autoprefixer()
    ]))
    .pipe(gulp.dest(`${config.build}/css`))
    .pipe(minify())
    .pipe(rename("style.min.css"))
    .pipe(gulp.dest(`${config.build}/css`));
});

/* Normalize.css */

gulp.task("normalize", function () {
  return gulp.src(`${config.src}/scss/normalize.scss`)
    .pipe(plumber())
    .pipe(sass())
    .pipe(minify())
    .pipe(rename("normalize.min.css"))
    .pipe(gulp.dest(`${config.build}/css`));
});

/* Транспайлинг JS и минификация */

gulp.task("js", function () {
  return gulp.src(`${config.src}/js/**/*.js`)
    .pipe(plumber())
    .pipe(babel({
      presets: ['env']
    }))
    .pipe(concat('main.js'))
    .pipe(gulp.dest(`${config.build}/js`))
    .pipe(uglifyJs())
    .pipe(rename("main.min.js"))
    .pipe(gulp.dest(`${config.build}/js`));
});

/* Оптимизация картинок */

gulp.task("images", function () {
  return gulp.src(`${config.src}/img/**/*.{png,jpg,svg}`)
    .pipe(imagemin([
      imagemin.optipng({
        optimizationLevel: 3
      }),
      imagemin.jpegtran({
        progressive: true
      }),
      imagemin.svgo({
        plugins: [{
          removeViewBox: false
        }]
      })
    ]))
    .pipe(gulp.dest(`${config.src}/img`));
});

/* Конвертация в webp */

gulp.task("webp", function () {
  return gulp.src(`${config.src}/img/**/*.{png,jpg}`)
    .pipe(webp({
      quality: 90
    }))
    .pipe(gulp.dest(`${config.src}/img`));
});

/* Сборка SVG спрайта */

gulp.task("sprite", function () {
  return gulp.src(`${config.src}/img/icon-*.svg`)
    .pipe(plumber())
    .pipe(svgstore({
      inlineSvg: true
    }))
    .pipe(rename("sprite.svg"))
    .pipe(gulp.dest(`${config.build}/img`))

});

/* Сборка данных из JSON */

gulp.task('pug:data', function () {
  return gulp.src(`${config.src}/**/*.json`)
    .pipe(merge({
      fileName: 'data.json',
      edit: (json, file) => {
        // Extract the filename and strip the extension
        let filename = path.basename(file.path),
          primaryKey = filename.replace(path.extname(filename), '');

        // Set the filename as the primary key for our JSON data
        let data = {};
        data[primaryKey.toLowerCase()] = json;

        return data;
      }
    }))
    .pipe(gulp.dest(`${config.src}/temp`));
});

/* Сборка Pug */

gulp.task('pug-build', ['pug:data'], function () {
  const options = {
    indent_size: 2,
    unformatted: [ // https://www.w3.org/TR/html5/dom.html#phrasing-content
      'abbr', 'area', 'b', 'bdi', 'bdo', 'br', 'cite',
      'code', 'data', 'datalist', 'del', 'dfn', 'em', 'embed', 'i', 'ins', 'kbd', 'keygen', 'map', 'mark', 'math', 'meter', 'noscript',
      'object', 'output', 'progress', 'q', 'ruby', 's', 'samp', 'small',
      'strong', 'sub', 'sup', 'template', 'time', 'u', 'var', 'wbr', 'text',
      'acronym', 'address', 'big', 'dt', 'ins', 'strike', 'tt'
    ]
  };

  return gulp.src(project.pages)
    .pipe(plumber())
    .pipe(data(function () {
      if (fileExist(`${config.src}/temp/data.json`)) {
        return JSON.parse(fs.readFileSync(`${config.src}/temp/data.json`))
      }
    }))
    .pipe(pug({
      pretty: true
    }))
    .pipe(htmlbeautify(options))
    .pipe(gulp.dest(config.build));
});

/* Удаление data.json */

gulp.task("data-remove", function () {
  return del(`${config.src}/temp`);
});

gulp.task("pug", function () {
  run("pug-build", "data-remove");
});

/* Удаление папки с билдом */

gulp.task("clean", function () {
  return del(config.build);
});

/* Копирование в папку с билдом */

gulp.task("copy", function () {
  return gulp.src([
    `${config.src}/fonts/**/*.{woff,woff2}`,
    `${config.src}/img/**`,
    // `${config.src}/js/**`
  ], {
    base: config.src
  })
    .pipe(gulp.dest(config.build));
});

/* Сборка проекта */

gulp.task("build", function (done) {
  run(
    "clean",
    "copy",
    "normalize",
    "style",
    "sprite",
    "pug",
    "data-remove",
    "js",
    done
  );
});

/* Дополнительные функции */

function fileExist(filepath) {
  let flag = true;
  try {
    fs.accessSync(filepath, fs.F_OK);
  } catch (e) {
    flag = false;
  }
  return flag;
}
