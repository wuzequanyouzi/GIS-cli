/*
 * @Author: zequan.wu
 * @Date: 2021-07-07 09:21:53
 * @LastEditors: zequan.wu
 * @LastEditTime: 2021-07-07 16:23:07
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
  4202020: thingColor,
  // 4303050: urbanTrunkRoad,
  4303050: thingColor,
  4201011: nationalHighway,
  4202011: provincialHighway,
  4211011: countyHighway,
  4211021: countyHighway,
  4402020: ruralRoad,
  4305011: ruralRoad,
  4305021: ruralRoad,
  4305031: ruralRoad,
  4305040: ruralRoad,
  4101022: railway,
  4101023: railway,
  4209011: expressway,
  4209012: expressway,
  4205011: urbanTrunkRoad,
  4206010: otherWay,
  4307020: otherWay,
};

export { roadMaterialMap };
