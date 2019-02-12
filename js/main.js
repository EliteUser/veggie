"use strict";

var menuButtons = document.querySelectorAll(".menu__button");
var menuTabs = document.querySelectorAll(".menu__tab");

var navButton = document.querySelector(".main-navigation__button");
var navList = document.querySelector(".main-navigation__list");

navButton.addEventListener("click", function () {
  navButton.classList.toggle("main-navigation__button--active");
  navList.classList.toggle("main-navigation__list--show");
});

for (var i = 0; i < menuButtons.length; i++) {
  clickControl(menuButtons[i], menuTabs[i]);
}

function clickControl(control, slide) {
  control.addEventListener("click", function (evt) {
    evt.preventDefault();
    toggleSlide(control, slide);
  });
}

function toggleSlide(control, slide) {
  for (var i = 0; i < menuButtons.length; i++) {
    menuButtons[i].classList.remove("menu__button--active");
    menuTabs[i].classList.remove("menu__tab--active");
  }

  control.classList.add("menu__button--active");
  slide.classList.add("menu__tab--active");
}