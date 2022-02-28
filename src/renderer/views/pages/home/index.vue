<script setup lang="ts">
import loadImages from "./asimg";
import { changeDpiDataUrl } from "./dpi.js";

import { onMounted, Ref, ref, defineComponent, watch } from 'vue';
import customize from '@/renderer/store/customize';
import {
  windowShow,
} from '@/renderer/common/window';
import { isNull } from "@/util";
import {
  NNotificationProvider, NMessageProvider, NSelect,
  useMessage, useNotification, NButton,
  NInput, NGrid, NGi, NotificationApi, MessageApi, NInputNumber
} from 'naive-ui'

import { Snowflake } from '@/util/snowflake';
import { setLanguage,i18nt } from "@/renderer/i18n";

import { openDialog } from "@/renderer/common/additional/dialog";

//NotificationApi  MessageApi 初始化
type placementType = "top-left" | "top-right" | "bottom-left" | "bottom-right"
const placement: Ref<placementType> = ref('bottom-right')
const msgPlacement: Ref<placementType | 'top' | 'bottom'> = ref('top')
let notification: NotificationApi
let nmessage: MessageApi
// 对应模版中的 n-init 标签
const nInit = defineComponent({
  setup() {
    notification = useNotification()
    nmessage = useMessage()
  },
  render: () => { }
})

let picPath = ref('')

let outPath = ref('')

let dip = ref(true)

let suf = ref('.jpg')

let lang = ref('zh-cn')

let row_const = ref(5)

let col_const = ref(3)

let dpi_const = ref(300)

let height_const = ref(2500)

let width_const = ref(2250)

let langOp = [
  {
    label: 'Chinese',
    value: 'zh-cn',
  }, {
    label: 'English',
    value: 'en',
  },
]

let sufOp = [
  {
    label: 'JPG',
    value: '.jpg'
  },
  {
    label: 'PNG',
    value: '.png'
  }, {
    label: 'JPEG',
    value: '.jpeg'
  }
]

let canvas = document.createElement("canvas");
canvas.width = width_const.value;
canvas.height = height_const.value;
let context = canvas.getContext("2d");


let selectPicPath = () => {
  //@ts-ignore
  openDialog(customize.get().id, {
    defaultPath: picPath.value,
    title: i18nt('msg.pic'),
    properties: ['openDirectory', 'promptToCreate']
  }).then(res => {
    if (!res.canceled) {
      picPath.value = res.filePaths[0]
    }
  })
}

let selectOutPath = () => {
  //@ts-ignore
  openDialog(customize.get().id, {
    defaultPath: picPath.value,
    title: i18nt('msg.out'),
    properties: ['openDirectory', 'promptToCreate']
  }).then(res => {
    if (!res.canceled) {
      outPath.value = res.filePaths[0]
    }
  })
}

watch(lang, (n, _) => setLanguage(n))

let chak = () => {
  if (
    !picPath.value ||
    !outPath.value ||
    isNull(width_const.value) ||
    isNull(height_const.value) ||
    isNull(row_const.value) ||
    isNull(col_const.value) ||
    isNull(dpi_const.value)
  ) {
    return false
  }
  return true
}

let core = () => {
  if (!chak()) {
    nmessage.error(i18nt('msg.err'))
    return
  }
  nmessage.info(i18nt('msg.start'))
  dip.value = false
  window.ipc.invoke('get-file-path', { path: picPath.value, suf: suf.value }).then(async (res) => {
    let par = []
    for (const p of res) {
      par.push(p)
      if (par.length === 15) {
        await cre(par)
        par = []
      }
    }
    dip.value = true
    nmessage.info(i18nt('msg.end'))
  })
}

async function cre(path: string[]) {
  let i = 0, x = 0, y = 0
  canvas.width = width_const.value;
  canvas.height = height_const.value;
  for (const p of path) {
    i++
    if (i !== col_const.value) {
      const pimg = await loadImages(p)
      //@ts-ignore
      context.drawImage(pimg, x, y, width_const.value / col_const.value, height_const.value / row_const.value)
      x += width_const.value / col_const.value
    } else {
      const pimg = await loadImages(p)
      //@ts-ignore
      context.drawImage(pimg, x, y, width_const.value / col_const.value, height_const.value / row_const.value)
      y += height_const.value / row_const.value
      x = 0
      i = 0
    }
  }

  let id = new Snowflake(0n, 0n).nextId()

  window.ipc.invoke('base-seve', { data: changeDpiDataUrl(canvas.toDataURL("image/png"), dpi_const.value), path: outPath.value, id }).then(res => {
    if (!!res) {
      notification.success({
        title: i18nt('msg.sus'),
        content: `${outPath.value}/${id}.jpg`
      })
    } else {
      notification.error({
        title: i18nt('msg.fid'),
        content: `${outPath.value}/${id}.jpg`
      })
    }
  })
}

onMounted(async () => {
  windowShow();
});


</script>

<style lang='scss' scoped>
@import "./scss/index";
</style>

<template>
  <div class="container">
    <Head />
    <div class="home-info">
      <n-notification-provider :placement="placement" :max="3">
        <n-message-provider :placement="msgPlacement" :max="3">
          <n-init />
          <n-grid x-gap="24" :cols="3">
            <n-gi>&nbsp;</n-gi>
            <n-gi>
              <n-select v-model:value="lang" :options="langOp" />
            </n-gi>
            <n-gi>
              <n-button :disabled="!dip" @click="core">{{ $t("buttons.start") }}</n-button>
            </n-gi>
          </n-grid>
          <n-grid x-gap="24" :cols="1">
            <n-gi>&nbsp;</n-gi>
          </n-grid>
          <n-grid x-gap="24" :cols="4">
            <n-gi>
              <n-input
                v-model:value="picPath"
                :readonly="true"
                type="text"
                :placeholder="$t('input.pic')"
              />
            </n-gi>
            <n-gi>
              <n-button @click="selectPicPath">{{ $t("buttons.fileBtn") }}</n-button>
            </n-gi>
            <n-gi>
              <n-input
                v-model:value="outPath"
                :readonly="true"
                type="text"
                :placeholder="$t('input.out')"
              />
            </n-gi>
            <n-gi>
              <n-button @click="selectOutPath">{{ $t("buttons.fileBtn") }}</n-button>
            </n-gi>
          </n-grid>
          <n-grid x-gap="24" :cols="1">
            <n-gi>&nbsp;</n-gi>
          </n-grid>
          <n-grid x-gap="24" :cols="3">
            <n-gi>
              <n-input-number :min="500" :step="100" v-model:value="height_const" clearable>
                <template #prefix>{{ $t("const.h") }}</template>
              </n-input-number>
            </n-gi>
            <n-gi>
              <n-input-number :min="500" :step="100" v-model:value="width_const" clearable>
                <template #prefix>{{ $t("const.w") }}</template>
              </n-input-number>
            </n-gi>
          </n-grid>
          <n-grid x-gap="24" :cols="1">
            <n-gi>&nbsp;</n-gi>
          </n-grid>
          <n-grid x-gap="24" :cols="3">
            <n-gi>
              <n-input-number :min="1" v-model:value="row_const" clearable>
                <template #prefix>{{ $t("const.r") }}</template>
              </n-input-number>
            </n-gi>
            <n-gi>
              <n-input-number :min="1" v-model:value="col_const" clearable>
                <template #prefix>{{ $t("const.c") }}</template>
              </n-input-number>
            </n-gi>
          </n-grid>
          <n-grid x-gap="24" :cols="1">
            <n-gi>&nbsp;</n-gi>
          </n-grid>
          <n-grid x-gap="24" :cols="3">
            <n-gi>
              <n-select v-model:value="suf" :options="sufOp" />
            </n-gi>
            <n-gi>
              <n-input-number :min="96" v-model:value="dpi_const" clearable>
                <template #prefix>dpi</template>
              </n-input-number>
            </n-gi>
          </n-grid>
          <n-grid x-gap="24" :cols="1">
            <n-gi>&nbsp;</n-gi>
          </n-grid>
          <n-grid x-gap="24" :cols="3">
            <n-gi></n-gi>
            <n-gi></n-gi>
          </n-grid>
        </n-message-provider>
      </n-notification-provider>
    </div>
  </div>
</template>