/*
 * @Author: zequan.wu
 * @Date: 2021-06-25 10:11:41
 * @LastEditors: zequan.wu
 * @LastEditTime: 2021-07-08 15:29:55
 * @Description: file content
 */
import Vue from "vue";
import VueRouter from "vue-router";
import Home from "../views/Home.vue";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    name: "Home",
    component: Home,
  },
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes,
});

export default router;
