const express = require('express');

module.exports = (app) => {
  // Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
};