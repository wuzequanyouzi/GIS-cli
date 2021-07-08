/*
 * @Author: zequan.wu
 * @Date: 2021-06-25 10:11:41
 * @LastEditors: zequan.wu
 * @LastEditTime: 2021-06-30 14:27:49
 * @Description: file content
 */
module.exports = {
  root: true,
  env: {
    node: true
  },
  extends: ["plugin:vue/essential", "eslint:recommended", "@vue/prettier"],
  parserOptions: {
    parser: "babel-eslint"
  },
  rules: {
    "no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
    "no-debugger": process.env.NODE_ENV === "production" ? "warn" : "off",
    "no-unused-vars": "off",
    "vue/no-unused-components": "warn"
  }
};
