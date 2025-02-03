# 快捷菜单 `v1.0.0`
开发便捷, 使用快捷!

<div class="grid cards" markdown>

<div class="grid cards" markdown>

- 路径 message-tail
- 作者 Cdm2883
- 最新 v1.0.0

> 依赖 无

</div>

``` js title="插件配置" linenums="13"
const config = {
    command: {
        name: "bridgeo", // (1)
        description: `§l§7// §rBridGeo §4Q§cu§6i§gc§ek§2M§ae§3n§du` // (2)
    }
};
```

1. 要注册的命令的名称
2. 要注册的命令的描述

</div>

## 🕗 注册快捷菜单

### 元数据
菜单通过读取插件元数据的`quick_menu`字段获取展示菜单列表上的内容.
```js
export const metadata = {
    // ...
    quick_menu: {
        text: 'string|function|null',  // (1)
        image: 'string|null'  // (2)
    }
};
```

1. 菜单列表按钮显示的文本内容. 可为函数将调用获取返回值 (`this`指向`代理this`).
2. 菜单列表按钮显示的图片. 格式同`modal_form_request`的`form`表单

### 菜单入口
你需要在模块根导出一个`quickMenu(arg: string)`函数:
```js
export function quickMenu(arg) {
    // ...
}
```

其中入参`arg`:

- 如果使用命令`/bridgeo <path:filepath> <arg:string>`, 将被设置为命令的第二个参数`arg`
- 如果使用命令`/bridgeo`的菜单列表打开, 将被设置为`undefined`
