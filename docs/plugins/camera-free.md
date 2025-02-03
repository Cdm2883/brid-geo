# 自由摄像机 `v1.0.0`
自由调整摄像机!

<div class="grid cards" markdown>

<div class="grid cards" markdown>

- 路径 camera-free
- 作者 Cdm2883
- 最新 v1.0.0
- 依赖 quick-menu

</div>

``` js title="默认预设" linenums="30" hl_lines="2-6"
const templates = [
    {
        name: '俯视', // (1)
        position: string2xyz('~ ~20 ~'), // (3)
        rotation: string2xz('~ ~') // (4)
    },
    {
        name: '鸟瞰',
        ease: true,  // (2)
        position: string2xyz('~ ~20 ~'),  
        rotation: string2xz('90 0')
    },
    {
        name: '过肩视角',
        ease: true,
        position: string2xyz('^-2 ^2 ^-4'),
        facing: string2xyz('^ ^ ^5')  // (5)
    }
];
```

1. 显示名称
2. 相机视角是否平滑过渡
3. 摄像机坐标 `{ x, y, z }`
4. 摄像机偏转 `{ x, z }`
5. 摄像机朝向 `{ x, y, z }`

</div>

## 🕗 快捷菜单
`/bridgeo camera-free` - 打开主菜单

## 📹 摄像机配置
!!! info

    建议先了解`/camera`命令的各个参数, 这会帮助你理解!  
    [Minecraft Wiki - 命令/camera](https://zh.minecraft.wiki/w/%E5%91%BD%E4%BB%A4/camera)

### 显示名称 `string`
> 该摄像机在摄像机列表中显示的名称.
> 修改此项有助于您区分不同的摄像机.

### 相机视角平滑过渡 `boolean`
> 在不同的摄像机视角切换时是否增加过渡效果.
> 关闭此项可以试视角切换时反应更加迅速.  
> 该效果开启等同于`/camera`命令中`ease 0.25 in_out_quad`的效果.
> 具体效果可从`camera-free.js`中的`:241`处修改.

### 摄像机坐标 `string`
> 摄像机的坐标. 可以使用绝对坐标和相对坐标 (`~`, `^`).  
> 如使用相对坐标, 摄像机将根据玩家当前坐标实时计算摄像机当前应位于的坐标.

### 摄像机偏转 `string?`
> 摄像机的偏转欧拉角 (`pitch`, `yaw`). 可以使用绝对角和相对角 (`~`).  
> 如使用相对角, 摄像机将根据玩家当前方向角实时与相对角进行求和计算摄像机当前应应用的偏转.

### 摄像机朝向 `string?`
> 摄像机朝向的坐标. 可以使用绝对坐标和相对坐标 (`~`, `^`).  
> 如使用相对坐标, 摄像机将根据玩家当前坐标实时计算摄像机当前应位于的坐标.

## 🚧 注意事项
玩家的摄像机数据储存在**内存**中, 无法持久化保存!  
也就是说一旦关闭`bridgeo`程序, 所有玩家的摄像机数据将丢失!  
若想永久储存, 可尝试修改`默认预设`.  
并且每位玩家的摄像机数据**分世界**储存, 不同世界/地图/服务器拥有不同的储存空间!
