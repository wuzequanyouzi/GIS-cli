<!--
 * @Author: zequan.wu
 * @Date: 2021-06-25 10:11:41
 * @LastEditors: zequan.wu
 * @LastEditTime: 2021-07-08 17:28:38
 * @Description: file content
-->
<template>
  <div class="home">
    <Map ref="map" :notMouseOperation="notMouseOperation" />
    <div class="option">
      <div
        class="switch"
        :class="[notMouseOperation ? 'open' : 'close']"
        @click="switchOfDemonstration"
      >
        {{ "演示: " + switchLabel }}
      </div>
    </div>

    <p class="label">{{ label }}</p>

    <div class="change-mode-btn" @click="changeMode">
      当前视图模式: {{ mode }}，点击切换
    </div>
  </div>
</template>

<script>
import Map from "@/components/Map.vue";
export default {
  name: "Home",
  components: {
    Map,
  },
  data() {
    return {
      notMouseOperation: true,
      is3D: true,
    };
  },
  computed: {
    switchLabel() {
      return this.notMouseOperation ? "关" : "开";
    },

    label() {
      return this.notMouseOperation ? "正在演示中..." : "";
    },
    mode() {
      return this.is3D ? "3D" : "2D";
    },
  },
  methods: {
    switchOfDemonstration() {
      this.notMouseOperation = !this.notMouseOperation;
    },
    changeMode() {
      this.is3D = !this.is3D;
      this.notMouseOperation = false;
      this.$refs.map.changeViewMode(this.is3D);
    },
  },
};
</script>

<style lang="scss" scoped>
.home {
  width: 100%;
  height: 100%;
  position: relative;
}
.option {
  position: absolute;
  top: 40px;
  left: 40px;
  .switch {
    border: 1px solid;
    background-color: transparent;
    text-transform: uppercase;
    font-size: 14px;
    padding: 10px 40px;
    font-weight: 300;
    cursor: pointer;
    border-radius: 4px;
  }
  .open {
    background-color: #4cc9f0;
    color: #fff;
    -webkit-box-shadow: 10px 10px 99px 6px rgba(76, 201, 240, 1);
    -moz-box-shadow: 10px 10px 99px 6px rgba(76, 201, 240, 1);
    box-shadow: 10px 10px 99px 6px rgba(76, 201, 240, 1);
    &:hover {
      background-color: unset;
      color: #4cc9f0;
      -webkit-box-shadow: 10px 10px 99px 6px rgb(21, 22, 22);
      -moz-box-shadow: 10px 10px 99px 6px rgb(21, 22, 22);
      box-shadow: 10px 10px 99px 6px rgb(21, 22, 22);
    }
  }
  .close {
    color: #4cc9f0;
    &:hover {
      background-color: #4cc9f0;
      color: #fff;
      -webkit-box-shadow: 10px 10px 99px 6px rgba(76, 201, 240, 1);
      -moz-box-shadow: 10px 10px 99px 6px rgba(76, 201, 240, 1);
      box-shadow: 10px 10px 99px 6px rgba(76, 201, 240, 1);
    }
  }
}
.label {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  margin: 20px auto 0;
  font-size: 24px;
  color: #fff;
}
.change-mode-btn {
  position: absolute;
  right: 10px;
  top: 10px;
  width: 150px;
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 4px;
  border: 1px solid #fff;
  color: #fff;
  background-color: #26354a;
  cursor: pointer;
}
</style>
