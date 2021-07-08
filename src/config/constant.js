/*
 * @Author: zequan.wu
 * @Date: 2021-07-07 09:21:53
 * @LastEditors: zequan.wu
 * @LastEditTime: 2021-07-08 11:58:31
 * @Description: file content
 */

import urbanExpressway from "@/assets/image/urbanExpressway.png";
import urbanTrunkRoad from "@/assets/image/urbanTrunkRoad.png";
import nationalHighway from "@/assets/image/nationalHighway.png";
import provincialHighway from "@/assets/image/provincialHighway.png";
import countyHighway from "@/assets/image/countyHighway.png";
import ruralRoad from "@/assets/image/ruralRoad.png";
import railway from "@/assets/image/railway.png";
import expressway from "@/assets/image/expressway.png";
import otherWay from "@/assets/image/otherWay.png";
import thingColor from "@/assets/image/thingColor.png";

const roadMaterialMap = {
  // 4202020: urbanExpressway,
  4202020: expressway,
  // 4303050: urbanTrunkRoad,
  4303050: expressway,
  4201011: expressway,
  4202011: expressway,
  4211011: expressway,
  4211021: expressway,
  4402020: ruralRoad,
  4305011: ruralRoad,
  4305021: ruralRoad,
  4305031: ruralRoad,
  4305040: ruralRoad,
  4101022: expressway,
  4101023: expressway,
  4209011: expressway,
  4209012: expressway,
  4205011: ruralRoad,
  4206010: expressway,
  4307020: expressway,
};

export { roadMaterialMap };
