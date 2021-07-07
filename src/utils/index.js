/*
 * @Author: zequan.wu
 * @Date: 2021-06-30 16:38:27
 * @LastEditors: zequan.wu
 * @LastEditTime: 2021-07-07 14:19:51
 * @Description: file content
 */
import * as Cesium from "cesium/Build/Cesium/Cesium";
import colors from "@/assets/image/colors.png";
function PolylineTrailLinkMaterialProperty(
  color,
  duration,
  image = colors,
  type
) {
  this._definitionChanged = new Cesium.Event();
  this._color = undefined;
  this._colorSubscription = undefined;
  this.color = color;
  this.duration = duration;
  this.image = image;
  this._time = new Date().getTime();

  // 在Material上挂载相关的流动线纹理 可以根据自己的需要进行封装
  this.PolylineTrailLinkType = type;
  this.PolylineTrailLinkImage = image;
  Cesium.Material._materialCache.addMaterial(this.PolylineTrailLinkType, {
    fabric: {
      type: this.PolylineTrailLinkType,
      uniforms: {
        color: new Cesium.Color(0.0, 0.0, 1.0, 0.5),
        image,
        time: 0,
      },
      source:
        // 定义着色器源码 核心部分
        "czm_material czm_getMaterial(czm_materialInput materialInput)\n\
        {\n\
            czm_material material = czm_getDefaultMaterial(materialInput);\n\
            vec2 st = materialInput.st;\n\
            vec4 colorImage = texture2D(image, vec2(fract(st.s - time), st.t));\n\
            material.alpha = colorImage.a;\n\
            material.diffuse = colorImage.rgb;\n\
            return material;\n\
        }",
    },
    translucent: function (material) {
      return true;
    },
  });
  this.getType = function (time) {
    return this.PolylineTrailLinkType;
  };
  this.getValue = function (time, result) {
    if (!Cesium.defined(result)) {
      result = {};
    }
    // result.color = Cesium.Property.getValueOrClonedDefault(
    //   this._color,
    //   time,
    //   Cesium.Color.WHITE,
    //   result.color
    // );
    // result.image = this.PolylineTrailLinkImage;
    result.time =
      ((new Date().getTime() - this._time) % this.duration) / this.duration;
    return result;
  };
}
Object.defineProperties(PolylineTrailLinkMaterialProperty.prototype, {
  isConstant: {
    get: function () {
      return false;
    },
  },
  definitionChanged: {
    get: function () {
      return this._definitionChanged;
    },
  },
  color: Cesium.createPropertyDescriptor("color"),
});
// PolylineTrailLinkMaterialProperty.prototype.getType = function (time) {
//   return this.PolylineTrailLinkType;
// };
// PolylineTrailLinkMaterialProperty.prototype.getValue = function (time, result) {
//   if (!Cesium.defined(result)) {
//     result = {};
//   }
//   result.color = Cesium.Property.getValueOrClonedDefault(
//     this._color,
//     time,
//     Cesium.Color.WHITE,
//     result.color
//   );
//   result.image = this.PolylineTrailLinkImage;
//   result.time =
//     ((new Date().getTime() - this._time) % this.duration) / this.duration;
//   return result;
// };
PolylineTrailLinkMaterialProperty.prototype.equals = function (other) {
  return (
    this === other ||
    (other instanceof PolylineTrailLinkMaterialProperty &&
      Cesium.Property.equals(this._color, other._color))
  );
};

export { PolylineTrailLinkMaterialProperty };
