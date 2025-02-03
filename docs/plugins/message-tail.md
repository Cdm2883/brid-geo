# 消息小尾巴 `v1.0.0`
示例插件, 似乎没什么实际用处?

<div class="grid cards" markdown>

<div class="grid cards" markdown>

- 路径 message-tail
- 作者 Cdm2883
- 最新 v1.0.0

> 依赖 无

</div>

``` js title="小尾巴配置" linenums="11"
const config = {
    chat: `${SS}r${SS}o${SS}7 --- BridGeo消息小尾巴~`
};
```

</div>

## 📖 小尾巴配置

### 键 `key`
要启用小尾巴的文本类型

### 值 `string|function`
若类型为字符串, 则在消息内容末尾添加该字符串.  
若类型为函数, 则将消息内容作为函数的第一个参数调用, 并将消息替换为函数的返回值 (`this`指向`代理this`).  
