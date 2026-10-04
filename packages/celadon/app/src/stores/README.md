# `stores/` —— 跨功能的公共状态

**现在这里是空的。** 公共状态等第一个真产品页来了再建 —— 没有消费者之前，写在这里的 store
都是对产品形态的猜测（2026-10-04 删掉了 `side-panel` / `entry` 两个这样的猜测，见
[`plan/05-scaffold.md`](../../plan/05-scaffold.md) §6.1）。

什么时候该有文件：

- 这份状态**说不清归哪个功能**（跨功能共享），并且**已经有真实的消费方**；
- 命名用**事实名**（`session.ts` · `current-team.ts`），不加 `.store` 后缀 —— 目录已经说明了角色
  （见 [`architecture/06-state.md`](../../architecture/06-state.md)）；
- 功能自己的私有状态不放这里，跟着它自己的域住在 `features/<域>/<名>.store.ts`。
