/*
 * @Author: zequan.wu
 * @Date: 2021-07-07 14:07:22
 * @LastEditors: zequan.wu
 * @LastEditTime: 2021-07-07 17:08:48
 * @Description: file content
 */
import * as Cesium from "cesium/Build/Cesium/Cesium";
import colors from "@/assets/image/colors.png";
function PolylineTrailLinkMaterialProperty(options = {}) {
  this._definitionChanged = new Cesium.Event();
  this._image = undefined;
  this._imageSubscription = undefined;
  this._color = undefined;
  this._colorSubscription = undefined;
  this._glowPower = undefined;
  this._glowPowerSubscription = undefined;
  this._taperPower = undefined;
  this._taperPowerSubscription = undefined;
  this._transparent = undefined;
  this._transparentSubscription = undefined;

  options.image = options?.image ?? colors;
  options.glowPower = options?.taperPower ?? 0.25;
  options.taperPower = options?.taperPower ?? 1.0;

  this.image = options.image;
  this.color = options.color;
  this.transparent = options.transparent || true;
  this.duration = options.duration || 3000;
  this.glowPower = options.glowPower;
  this.taperPower = options.taperPower;
  this._time = new Date().getTime();

  Cesium.PolylineTrailLinkMaterialProperty = PolylineTrailLinkMaterialProperty;
  Cesium.Material.PolylineTrailLinkMaterialType = "PolylineTrailLink";
  // czm_material： 一个Cesium封装的GLSL类型
  // 编写一个着色器函数，czm_materialInput => czm_material
  //
  Cesium.Material.PolylineTrailLinkMaterialSource =
    // 定义着色器源码 核心部分
    "uniform vec4 color;\n\
    uniform float glowPower;\n\
    uniform float taperPower;\n\
    czm_material czm_getMaterial(czm_materialInput materialInput)\n\
    {\n\
        czm_material material = czm_getDefaultMaterial(materialInput);\n\
        vec2 st = materialInput.st;\n\
        vec4 colorImage = texture2D(image, vec2(fract(st.s - time), st.t));\n\
        float glow = glowPower / abs(st.t - 0.5) - (glowPower / 0.5);\n\
        if (taperPower <= 0.99999) {\n\
          glow *= min(1.0, taperPower / (0.5 - st.s * 0.5) - (taperPower / 0.5));\n\
        }\n\
        colorImage.a = clamp(0.0, 1.0, glow) * color.a;\n\
        material.alpha = colorImage.a;\n\
        material.diffuse = colorImage.rgb;\n\
        return material;\n\
    }";
  Cesium.Material._materialCache.addMaterial(
    Cesium.Material.PolylineTrailLinkMaterialType,
    {
      fabric: {
        type: Cesium.Material.PolylineTrailLinkMaterialType,
        uniforms: {
          color: new Cesium.Color(1.0, 0.0, 0.0, 1),
          image: options.image,
          glowPower: 0.3,
          taperPower: 1.0,
          time: 0,
        },
        source: Cesium.Material.PolylineTrailLinkMaterialSource,
      },
      translucent: function (material) {
        return true;
      },
    }
  );
}

Object.defineProperties(PolylineTrailLinkMaterialProperty.prototype, {
  isConstant: {
    get() {
      return false;
    },
  },
  definitionChanged: {
    get() {
      return this._definitionChanged;
    },
  },
  color: Cesium.createPropertyDescriptor("color"),
  image: Cesium.createPropertyDescriptor("image"),
  transparent: Cesium.createPropertyDescriptor("transparent"),
  glowPower: Cesium.createPropertyDescriptor("glowPower"),
  taperPower: Cesium.createPropertyDescriptor("taperPower"),
});
PolylineTrailLinkMaterialProperty.prototype.getType = function () {
  return "PolylineTrailLink";
};
PolylineTrailLinkMaterialProperty.prototype.getValue = function (time, result) {
  if (!Cesium.defined(result)) {
    result = {};
  }
  result.color = Cesium.Property.getValueOrClonedDefault(
    this._color,
    time,
    Cesium.Color.WHITE,
    result.color
  );
  result.glowPower = Cesium.Property.getValueOrDefault(
    this._glowPower,
    time,
    0.25,
    result.glowPower
  );
  result.taperPower = Cesium.Property.getValueOrDefault(
    this._taperPower,
    time,
    1.0,
    result.taperPower
  );
  result.image = Cesium.Property.getValueOrUndefined(this._image, time);
  result.time =
    ((new Date().getTime() - this._time) % this.duration) / this.duration;
};

PolylineTrailLinkMaterialProperty.prototype.equals = function (other) {
  return (
    this === other ||
    (other instanceof PolylineTrailLinkMaterialProperty &&
      Cesium.Property.equals(this._color, other._color) &&
      Cesium.Property.equals(this._image, other._image) &&
      Cesium.Property.equals(this._glowPower, other._glowPower) &&
      Cesium.Property.equals(this._taperPower, other._taperPower))
  );
};

export { PolylineTrailLinkMaterialProperty };
