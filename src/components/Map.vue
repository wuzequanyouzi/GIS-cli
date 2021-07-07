<template>
  <div
    id="cesiumContainer"
    :class="{ 'is-not-event': notMouseOperation }"
  ></div>
</template>

<script>
import {
  Viewer,
  TileMapServiceImageryProvider,
  ScreenSpaceEventType,
  Cesium3DTileset,
  Cartographic,
  Cartesian3,
  Matrix4,
  EntityCollection,
  DistanceDisplayCondition,
  NearFarScalar,
  Cartesian2,
  VerticalOrigin,
  ScreenSpaceEventHandler,
  HeadingPitchRange,
  defined,
  Math as CesiumMath,
  HeadingPitchRoll,
  Transforms,
  Rectangle,
  Color,
  // mapbox地图
  MapboxStyleImageryProvider,
  Property,
  Primitive,

  // 几何图形相关
  GeometryInstance,
  PolygonGeometry,
  PolygonHierarchy,
  EllipsoidSurfaceAppearance,
  Material,
  GeoJsonDataSource,
} from "cesium/Build/Cesium/Cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import { PolylineTrailLinkMaterialProperty } from "@/utils/test.js";

import { getRequest } from "@/api";

import { roadMaterialMap } from "@/config/constant.js";

import p1 from "@/assets/image/colors1.png";
import p2 from "@/assets/image/colors3.png";
import j1 from "@/assets/image/colors2.jpg";
import expressway from "@/assets/image/expressway.png";
import waterImage from "@/assets/image/water.jpg";
export default {
  name: "Map",
  props: {
    notMouseOperation: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      checkedBuildings: [],
    };
  },
  created() {
    this.lastPickBuild = null;
    this.lastBckImage = null;
    this.positions = [];
    this.imageBase64List = {};
    this.activeImageBase64List = {};

    // 存储实体
    this.entities = [];

    this.entityCollection = new EntityCollection({
      id: "entityCollection_all",
    });
  },
  async mounted() {
    this.initMap();
    window.map = this;
    window.EntityCollection = EntityCollection;
    window.Cesium3DTileset = Cesium3DTileset;
    window.Cartographic = Cartographic;
    window.Cartesian3 = Cartesian3;
    window.Matrix4 = Matrix4;
    window.Material = Material;
  },
  beforeDestroy() {
    console.log("组件即将销毁");
    this.destroyViewer();
  },
  methods: {
    initMap() {
      // const TDMapLayer = new WebMapTileServiceImageryProvider({
      //   url:
      //     'http://{s}.tianditu.gov.cn/img_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={TileMatrix}&TILEROW={TileRow}&TILECOL={TileCol}&format=tiles&tk=ce8c90d7c720b0405c0121c6cd8edd99',
      //   layer: 'img',
      //   style: 'default',
      //   format: 'tiles',
      //   tileMatrixSetID: 'w',
      //   credit: new Credit('天地图全球影像服务'),
      //   subdomains: ['t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7'],
      //   maximumLevel: 18,
      //   show: false
      // });

      const mapBoxLayer = new MapboxStyleImageryProvider({
        url: "https://api.mapbox.com/styles/v1",
        username: "15217980296",
        styleId: "ckqiuk2jo036517pfwamuad7r",
        accessToken:
          "pk.eyJ1IjoiMTUyMTc5ODAyOTYiLCJhIjoiY2txaXRuMjR4MndyeTMxbGNiNmNmcXdzbSJ9.3uYvGa57S-P8DEDxJxA08Q",
        scaleFactor: true,
      });

      this.viewer = new Viewer("cesiumContainer", {
        animation: false, // 隐藏动画控件
        baseLayerPicker: false, // 隐藏图层选择控件
        fullscreenButton: false, // 隐藏全屏按钮
        vrButton: false, // 隐藏VR按钮，默认false
        geocoder: false, // 隐藏地名查找控件
        homeButton: false, // 隐藏Home按钮
        navigationHelpButton: false, // 隐藏帮助按钮
        scene3DOnly: false, // 每个几何实例将只在可视区域中呈现，以节省GPU内存
        sceneModePicker: false,
        timeline: false,
        requestRenderMode: false,
        selectionIndicator: false, // 关闭焦框
        imageryProvider: mapBoxLayer,
        // imageryProvider: new TileMapServiceImageryProvider({
        //   url: `http://127.0.0.1:5501/`,
        //   credit: "googleTitle",
        // }),
      });

      this.viewer.scene.debugShowFramesPerSecond = true;

      this.viewer.scene.globe.depthTestAgainstTerrain = false;
      this.viewer.scene.postProcessStages.fxaa.enabled = false;
      // 关闭logo信息
      this.viewer.cesiumWidget.creditContainer.style.display = "none";
      this.viewer.scene.screenSpaceCameraController.minimumZoomDistance = 50;
      this.viewer.scene.screenSpaceCameraController.maximumZoomDistance = 10000;

      // 取消默认的双击事件
      this.viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(
        ScreenSpaceEventType.LEFT_DOUBLE_CLICK
      );

      this.viewer.resolutionScale = window.devicePixelRatio;

      // 开启抗锯齿
      this.viewer.scene.fxaa = true;
      this.viewer.scene.postProcessStages.fxaa.enabled = true;

      this.setViewToHome();
      this.screenSpaceClickPosition();
      this.initPolyLine();
      // this.initWater();
      this.initLuwang();
      // this.initRiver();
      this.addPrimitivesForGeoJson();

      // long = 114.47999, lat = 22.97798
      this.initGlb();
      this.initGlb(0, 0, 0, 114.47979, 22.9775);
      this.initGlb(0, 0, 0, 114.480005, 22.98005);
      this.initGlb(0, 0, 0, 114.4803, 22.98035);
      this.initGlb(0, 0, 0, 114.4808, 22.98035);

      // 加载3Dtiles
      this.loading3DTiles();

      this.initCameraRotate();
    },

    loading3DTiles() {
      // http://10.75.251.162/tileSet/3DtileBaiMo/tileset.json
      const baiMoTiles = this.viewer.scene.primitives.add(
        new Cesium3DTileset({
          url: "http://10.75.251.162/tileSet/3DtileBaiMo/tileset.json",
        })
      );
      baiMoTiles.readyPromise.then((_baiMoTiles) => {
        // let cartographic = Cartographic.fromCartesian(
        //   _baiMoTiles.boundingSphere.center
        // );
        // let surface = Cartesian3.fromRadians(
        //   cartographic.longitude,
        //   cartographic.latitude,
        //   cartographic.height
        // );
        // let offset = Cartesian3.fromRadians(
        //   cartographic.longitude,
        //   cartographic.latitude,
        //   80
        // );
        // let translation = Cartesian3.subtract(
        //   offset,
        //   surface,
        //   new Cartesian3()
        // );
        // _baiMoTiles.modelMatrix = Matrix4.fromTranslation(translation);
      });
    },

    setViewToHome() {
      this.viewer.camera.setView({
        // fromDegrees()方法，将经纬度和高程转换为世界坐标
        destination: Cartesian3.fromDegrees(114.47932, 22.98434, 500.0),
        orientation: {
          // 指向
          heading: 2.93,
          // 视角
          pitch: -0.55,
          roll: 0,
        },
      });
      this.flyToHome();
    },
    flyToHome() {
      this.viewer.camera.flyTo({
        destination: new Cartesian3.fromDegrees(114.47932, 22.98434, 500.0),
        orientation: {
          heading: 2.93,
          pitch: -0.55,
          roll: 0.0,
        },
        duration: 3,
      });
    },

    flyToDestination(locationInfo) {
      const { heading, pitch, range = 120 } = locationInfo;
      const entitie = this.viewer.entities.getById(locationInfo.bsm);
      if (!entitie) {
        this.$message({
          type: "error",
          message: "当前建筑没有定位信息",
        });
      }
      if (!entitie.show) {
        this.showAllEntity();
      }
      if (heading != undefined && pitch != undefined) {
        this.viewer.flyTo(entitie, {
          offset: new HeadingPitchRange(
            parseFloat(heading),
            parseFloat(pitch),
            range
          ),
        });
      } else {
        this.viewer.flyTo(this.viewer.entities.getById(locationInfo.bsm));
      }
    },

    // 获取鼠标点击位置的经纬度高程
    screenSpaceClickPosition() {
      const handler = new ScreenSpaceEventHandler(this.viewer.scene.canvas);
      handler.setInputAction((clickEvent) => {
        const position = this.viewer.camera.pickEllipsoid(clickEvent.position);

        if (!position || (position && !(position.x && position.y))) {
          return;
        }
        const cartographic = Cartographic.fromCartesian(position);
        const longitude = CesiumMath.toDegrees(cartographic.longitude).toFixed(
          5
        );
        const latitude = CesiumMath.toDegrees(cartographic.latitude).toFixed(5);
        console.log(longitude, latitude);
        this.$emit("getBuildingPosition", {
          longitude,
          latitude,
          height: cartographic.height,
        });
      }, ScreenSpaceEventType.LEFT_CLICK);
    },

    // 获取摄像机视角
    screenSpaceViewAngleEvent() {
      const handler = () => {
        const position = Object.assign({}, this.viewer.camera.position);
        if (defined(position)) {
          // 将笛卡尔坐标转为经纬度和高程坐标（弧度制）
          const cartographic = Cartographic.fromCartesian(position);
          // 经纬度 弧度转角度
          const longitude = CesiumMath.toDegrees(
            cartographic.longitude
          ).toFixed(5);
          const latitude = CesiumMath.toDegrees(cartographic.latitude).toFixed(
            5
          );
          this.$emit("getScreenSpaceViewAngleInfo", {
            cameraLongitude: longitude,
            cameraLatitude: latitude,
            cameraHeight: cartographic.height,
            heading: this.viewer.scene.camera.heading,
            pitch: this.viewer.scene.camera.pitch,
            roll: this.viewer.scene.camera.roll,
            headingDegree: CesiumMath.toDegrees(
              this.viewer.scene.camera.heading
            ),
            position,
          });
        }
      };
      this.viewer.camera.moveEnd.addEventListener(handler);
    },
    removeEntitie(id) {
      if (this.viewer.entities.getById(id)) {
        this.viewer.entities.remove({ id });
      } else {
        console.error(`标注不存在${id}`);
      }
    },

    // 移除所有entity
    removeAllEntity() {
      this.viewer.entities.removeAll();
    },

    hideAllEntity() {
      this.viewer.entities._entities._array.forEach((entitie) => {
        entitie.show = false;
      });
    },

    showAllEntity() {
      this.viewer.entities._entities._array.forEach((entitie) => {
        entitie.show = true;
      });
    },

    // 销毁视图
    destroyViewer() {
      if (this.viewer) {
        this.viewer.dataSources.removeAll(true);
        // 销毁视图
        this.viewer.destroy();
      }
      this.viewer = null;
    },

    // 初始化测试材质polygon
    // initEntityFromMaterial() {
    //   // lon: 114.48024
    //   // lat: 22.97805
    //   this.material = this.viewer.entities.add({
    //     rectangle: {
    //       material: videoActiveImage,
    //       coordinates: Rectangle.fromDegrees(
    //         114.48024,
    //         22.97805,
    //         114.48034,
    //         22.97815
    //       ),
    //       height: 30.0,
    //     },
    //   });
    // },

    // 初始化测试模型
    initGlb(h = 0, p = 0, r = 0, long = 114.47999, lat = 22.97798) {
      // lon: 114.47999
      // lat: 22.97798
      // height: 8.090607476709359
      // pitch: -1.0231272955944153
      // roll: 0.002755173470617933
      // heading: 2.5011602835281876
      const position = new Cartesian3.fromDegrees(long, lat, 0.0);
      const heading = CesiumMath.toRadians(h);
      const pitch = CesiumMath.toRadians(p);
      const roll = CesiumMath.toRadians(r);
      const hpr = new HeadingPitchRoll(heading, pitch, roll);
      let orientation = Transforms.headingPitchRollQuaternion(position, hpr);
      this.model = this.viewer.entities.add({
        position,
        orientation,
        model: {
          uri: "http://localhost:5500/study/test.glb",
          color: Color.WHILE,
          minimumPixelSize: 40,
          colorBlendAmount: 0,
          maximumScale: 40,
          scale: 0.6,
          // distanceDisplayCondition: new DistanceDisplayCondition(10.0, 2000.0),
        },
      });
    },

    // 改变entitie方向
    changeDirectionOfEntitie(entitie, directionObj, position) {
      const carPosition = Cartesian3.fromDegrees(
        position[0],
        position[1],
        position[2]
      );
      const heading = CesiumMath.toRadians(directionObj.heading);
      const pitch = CesiumMath.toRadians(directionObj.pitch);
      const roll = CesiumMath.toRadians(directionObj.roll);
      const hpr = new HeadingPitchRoll(heading, pitch, roll);
      let orientation = Transforms.headingPitchRollQuaternion(carPosition, hpr);
      entitie._orientation._value = orientation;
    },

    initPolyLine() {
      const material = new PolylineTrailLinkMaterialProperty({
        image: j1,
        color: Color.WHILE,
        transparent: true,
        duration: 3000,
      });
      const material1 = new PolylineTrailLinkMaterialProperty({
        color: Color.WHILE,
        transparent: true,
        duration: 3000,
      });
      // window.material = material1;
      const positions1 = Cartesian3.fromDegreesArray([
        114.47958, 22.97901, 114.48247, 22.97892,
      ]);
      const redLine1 = this.viewer.entities.add({
        name: "Red line on terrain",
        polyline: {
          positions: Cartesian3.fromDegreesArray([
            114.47946, 22.97713, 114.47958, 22.97901, 114.47969, 22.98072,
          ]),
          width: 2,
          material: material,
        },
      });
      const redLine2 = this.viewer.entities.add({
        name: "Red line on terrain",
        polyline: {
          positions: positions1,
          width: 2,
          // material: material,
          material: material1,
        },
      });
    },

    initWater(positions, appearance) {
      let outLinePositionArray = Cartesian3.fromDegreesArray(positions.flat());
      const water = this.viewer.scene.primitives.add(
        new Primitive({
          geometryInstances: new GeometryInstance({
            // geometry 几何图形
            geometry: new PolygonGeometry({
              // polygonHierarchy 多边形层次结构， PolygonHierarchy构造函数，入参点位数组，返回多边形线性环的层次结构
              polygonHierarchy: new PolygonHierarchy(outLinePositionArray),

              // EllipsoidSurfaceAppearance 几何外观， VERTEX_FORMAT属性： 使用片段着色器计算几何图形除position、st(二维纹理坐标)之外的属性
              vertexFormat: EllipsoidSurfaceAppearance.VERTEX_FORMAT,
              // 距离地表高度 单位：m
              height: 0,
              // 凸出面距离地表高度 单位：m
              extrudedHeight: 0,
            }),
          }),

          // appearance 用于渲染图元的外观
          appearance,
          show: true,
        })
      );
    },

    initLuwang() {
      let materialMap = {};
      for (const key in roadMaterialMap) {
        console.log(key);
        materialMap[key] = new PolylineTrailLinkMaterialProperty({
          image: roadMaterialMap[key],
          color: Color.WHILE,
          transparent: true,
          duration: 1500,
        });
      }
      window.materialMap = materialMap;
      console.log(materialMap);
      const luwangData = GeoJsonDataSource.load(
        "http://192.168.205.101:5501/luwang.json",
        {
          stroke: Color.HOTPINK,
          fill: Color.PINK.withAlpha(0.5),
          strokeWidth: 3,
        }
      );
      this.viewer.dataSources.add(luwangData);
      luwangData.then((dataSources) => {
        const entities = dataSources.entities.values;
        console.log(entities);
        window.entities = entities;
        entities.forEach((entitie) => {
          entitie.polyline._material =
            materialMap[entitie.properties.YSDM._value];
        });
        console.log(dataSources);
      });
    },

    initRiver() {
      const appearance = new EllipsoidSurfaceAppearance({
        // aboveGround 几何图形位于地表
        aboveGround: true,
        material: new Material({
          fabric: {
            type: "Water",
            uniforms: {
              normalMap: waterImage,
              // 频率
              frequency: 400.0,
              animationSpeed: 0.01,
              // 振幅
              amplitude: 10.0,
            },
          },
        }),
      });
      const riversData = GeoJsonDataSource.load(
        "http://192.168.205.101:5501/rivers.geojson",
        {
          stroke: Color.HOTPINK,
          fill: Color.PINK.withAlpha(0.5),
          strokeWidth: 0,
        }
      );
      this.viewer.dataSources.add(riversData);
      riversData.then((dataSources) => {
        const entities = dataSources.entities.values;
        console.log(entities);
        // entities.forEach(entitie => {
        //   entitie.polygon.vertexFormat =
        // })
      });
    },

    // 图元方式加载GEOJSON
    addPrimitivesForGeoJson() {
      const appearance = new EllipsoidSurfaceAppearance({
        // aboveGround 几何图形位于地表
        aboveGround: true,
        material: new Material({
          fabric: {
            type: "Water",
            uniforms: {
              normalMap: waterImage,
              // 频率
              frequency: 400.0,
              animationSpeed: 0.01,
              // 振幅
              amplitude: 10.0,
            },
          },
        }),
      });
      getRequest("http://192.168.205.101:5501/rivers.geojson").then((res) => {
        console.log(res.data.features);
        res.data.features.forEach((feature) => {
          if (feature.geometry.type === "MultiPolygon") {
            const polygon = this.multiPolygonToPolygons(
              feature.geometry.coordinates
            );
            this.initWater(polygon, appearance);
          } else {
            this.initWater(feature.geometry.coordinates, appearance);
          }
        });
      });
    },
    multiPolygonToPolygons(MultiPolygon) {
      // debugger;
      let res = [];
      for (let index = 0; index < MultiPolygon.length; index++) {
        const polygon = MultiPolygon[index];
        if (Array.isArray(polygon)) {
          if (polygon.length === 2 && !Array.isArray(polygon[0])) {
            return MultiPolygon;
          } else {
            res.push(...this.multiPolygonToPolygons(polygon));
          }
        }
      }
      return res;
    },

    initCameraRotate() {
      let heading = 0;
      const fps = 31;
      const interval = 1000 / fps;
      let now = Date.now();

      const positionList = [
        [114.32253, 23.02582],
        [114.362, 23.04191],
        [114.28526, 23.01656],
        {
          start: [114.24728, 23.0162],
          end: [114.19811, 23.01527, 800],
        },
      ];
      const locationEntities = positionList.map((position, index) => {
        let long = null;
        let lat = null;
        if (Array.isArray(position)) {
          long = position[0];
          lat = position[1];
        } else {
          long = position.start[0];
          lat = position.start[1];
        }
        return this.viewer.entities.add({
          id: `location${index}`,
          position: Cartesian3.fromDegrees(long, lat),
          point: { pixelSize: 0 },
        });
      });
      let locationEntitie = locationEntities[0];
      let currentIndex = 0;
      const rotateFn = (time) => {
        const tempNow = Date.now();
        const difference = tempNow - now;
        let flag = true;
        if (difference > interval && this.notMouseOperation) {
          heading += interval * 0.025;
          now = tempNow;
          this.viewer.zoomTo(
            locationEntitie,
            new HeadingPitchRange(
              CesiumMath.toRadians(heading),
              CesiumMath.toRadians(-20),
              5000
            )
          );
          if (heading > 360) {
            console.log(this.framer);
            console.log(heading);
            cancelAnimationFrame(this.framer);
            flag = false;
            heading %= 360;
            ++currentIndex;
            const entitieIndex = currentIndex % locationEntities.length;
            locationEntitie = locationEntities[entitieIndex];
            const _positionObj = positionList[entitieIndex];
            if (!Array.isArray(_positionObj)) {
              this.startRoam(undefined, undefined, () => {
                this.startRoam(_positionObj.end[0], _positionObj.end[1], () => {
                  this.framer = requestAnimationFrame(rotateFn);
                });
              });
            } else {
              this.viewer
                .flyTo(locationEntitie, {
                  offset: new HeadingPitchRange(
                    CesiumMath.toRadians(heading),
                    CesiumMath.toRadians(-20),
                    5000
                  ),
                })
                .then(() => {
                  cancelAnimationFrame(this.framer);
                  this.framer = requestAnimationFrame(rotateFn);
                });
            }
          }
        }
        flag && (this.framer = requestAnimationFrame(rotateFn));
      };

      this.viewer
        .flyTo(locationEntities[0], {
          offset: new HeadingPitchRange(
            CesiumMath.toRadians(0),
            CesiumMath.toRadians(-20),
            5000
          ),
        })
        .then(() => {
          rotateFn(0);
        });
    },

    startRoam(long = 114.24728, lat = 23.0162, cb) {
      const position = Cartesian3.fromDegrees(long, lat, 800);
      this.viewer.camera.flyTo({
        destination: position,
        duration: 6,
        maximumHeight: 800,
        orientation: {
          heading: CesiumMath.toRadians(-90),
          pitch: CesiumMath.toRadians(-20),
          roll: CesiumMath.toRadians(0),
        },
        complete: () => {
          cb && cb();
        },
      });
    },
  },
};
</script>

<style lang="scss" scoped>
#cesiumContainer {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;

  /deep/ .cesium-viewer-infoBoxContainer {
    display: none !important;
  }

  /deep/ .cesium-viewer-toolbar {
    top: 45px;
    right: 45px;
  }
  /deep/ .active {
    display: block !important;
    background-color: unset !important;
  }
  /deep/ .hide {
    display: none !important;
    background-color: unset !important;
  }
}
.is-not-event {
  pointer-events: none;
}
</style>
