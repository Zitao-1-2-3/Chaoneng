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

---

## 3. 代理端用户列表 (user_list)

### 相关文件

- **类型定义**：`bot-frontend/src/api/tgUser/types.ts`
- **API接口**：`bot-frontend/src/api/tgUser/index.ts`
- **页面组件**：`bot-frontend/src/views/UserGroup/user_list/index.vue`
- **弹窗组件**：
  - `bot-frontend/src/views/UserGroup/user_list/components/MessageDialog.vue`
  - `bot-frontend/src/views/UserGroup/user_list/components/RechargeDialog.vue`
  - `bot-frontend/src/views/UserGroup/user_list/components/BalanceRecordDialog.vue`
  - `bot-frontend/src/views/UserGroup/user_list/components/MassSendRecordDialog.vue`
  - `bot-frontend/src/views/UserGroup/user_list/components/ChangePasswordDialog.vue`

### 主要数据类型

#### 用户列表响应

```typescript
UserListResponseV1 {
  list: UserItemV1[]
  pager: Pager
}
```

#### 群发记录响应

```typescript
MassSendListResponseV1 {
  list: MassSendItemV1[]
  pager: Pager
}
```

#### 用户账单响应

```typescript
UserBillListResponseV1 {
  list: UserBillItemV1[]
  pager: Pager
}
```

### 重构说明

- 类型定义按用途分类（用户列表、群发记录、用户账单）
- 响应类型匹配axios拦截器处理后的结构

---

## 4. 代理端充值订单 (recharge_order)

### 相关文件

- **类型定义**：`bot-frontend/src/api/recharge_order/type.ts`
- **API接口**：`bot-frontend/src/api/recharge_order/index.ts`
- **页面组件**：`bot-frontend/src/views/OrderManage/recharge_order/index.vue`

### 主要数据类型

#### 列表响应

```typescript
DepositListResponseV1 {
  list: DepositItemV1[]
  pager: Pager
}
```

#### 详情响应

```typescript
DepositDetailV1 {
  // 订单基本信息
  pay_transaction?: PayTransaction // 支付交易详情（包含from/to地址）
}
```

### 重构说明

- 类型定义按用途分类（列表、详情、支付交易）
- 响应类型匹配axios拦截器处理后的结构

---

## 5. 代理端黑名单列表 (black_list)

### 相关文件

- **类型定义**：`bot-frontend/src/api/black_list/types.ts`
- **API接口**：`bot-frontend/src/api/black_list/index.ts`
- **页面组件**：`bot-frontend/src/views/BlackList/index.vue`

### 主要数据类型

#### 列表响应

```typescript
BlackListResponseV1 {
  list: BlackListItemV1[]
  pager: Pager
}
```

#### 列表项

```typescript
BlackListItemV1 {
  id: number                    // 黑名单ID
  created_at: number            // 创建时间（Unix时间戳-秒）
  updated_at: number            // 更新时间（Unix时间戳-秒）
  agent_id: number              // 代理ID
  address: string               // 地址
  describe: string              // 描述
  agent_name: string            // 代理名称
}
```

### 重构说明

- 时间字段统一为 Unix 时间戳（秒）
- 操作列集成到 columns 数组中，避免过滤时丢失
- 清理未使用的注释和导入
- 优化参数处理逻辑
