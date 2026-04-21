# API 重构记录

---

## 1. 代理端兑换订单 (exchange_order)

### 相关文件

- **类型定义**：`bot-frontend/src/api/exchange_order/type.ts`
- **API接口**：`bot-frontend/src/api/exchange_order/index.ts`
- **页面组件**：`bot-frontend/src/views/OrderManage/exchange_order/index.vue`

### 主要数据类型

#### 列表响应

```typescript
ExchangeOrderListResponseV1 {
  list: ExchangeOrderItemV1[]
  pager: Pager
}
```

#### 详情响应

```typescript
ExchangeOrderDetailV1 {
  exchange: ExchangeInfo           // 兑换详情对话框
  pay_transaction: TransactionInfo  // 用户转TRX/USDT hash
  deliver_transaction: TransactionInfo // 系统发放TRX/USDT hash
}
```

### 重构说明

- 类型定义按用途分类（列表、详情、兑换、交易）
- 响应类型匹配axios拦截器处理后的结构

---

## 2. 代理端能量订单 (energy_order)

### 相关文件

- **类型定义**：`bot-frontend/src/api/energy_order/types.ts`
- **API接口**：`bot-frontend/src/api/energy_order/index.ts`
- **页面组件**：`bot-frontend/src/views/OrderManage/energy_order/index.vue`
- **详情组件**：`bot-frontend/src/views/OrderManage/energy_order/components/OrderDetailDialog.vue`

### 主要数据类型

#### 列表响应

```typescript
EnergyOrderListResponseV1 {
  list: EnergyOrderItemV1[]
  pager: Pager
}
```

#### 详情响应

```typescript
EnergyOrderDetailV1 {
  summary: OrderSummary      // 订单摘要（包含成本、利润等）
  resources: ResourceDetail[] // 资源列表（能量/带宽详情）
  activations?: ActivationDetail[] // 激活记录（批量激活订单）
}
```

### 重构说明

- 类型定义按用途分类（列表、详情、摘要、资源、激活）
- 响应类型匹配axios拦截器处理后的结构
