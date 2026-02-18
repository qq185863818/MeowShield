# 🛡️ MeowShield Toy Obfuscator

<p align="center">
  <strong>轻量级 JavaScript 混淆器玩具 / A Lightweight JavaScript Toy Obfuscator</strong>
</p>

<p align="center">
  <a href="#-introduction--简介">Introduction</a> •
  <a href="#-features--功能一览">Features</a> •
  <a href="#-usage--使用示例">Usage</a> •
  <a href="#-disclaimer--免责声明">Disclaimer</a>
</p>

---

## 🔗 Live Demo / 在线演示

👉 **Try it out here: [https://meowshield.com/toy](https://meowshield.com/toy)**

---

## 📌 Introduction / 简介

**MeowShield Toy Obfuscator** 是一个玩具级 JavaScript 混淆器，通过多种插件组合实现对 JS 代码的不同层次混淆处理。适合学习、测试和理解混淆算法的基本思路。

**MeowShield Toy Obfuscator** is a toy-level JavaScript obfuscator that uses multiple plugins to apply layered obfuscation to JS code. It is suitable for learning, testing, and understanding the basic ideas of obfuscation algorithms.

---

## 🔧 Features / 功能一览

MeowShield 集成了以下三种主要混淆技术 / MeowShield integrates the following three main obfuscation techniques:

### 1️⃣ constantObfuscation — 常量混淆（链式混淆）
**Constant Obfuscation (Chained)**

*   **CN**:
    *   将字面量常量（字符串、数字）提取到常量池。
    *   通过链式调用包装常量访问，使其更难理解。
    *   可组合多个中间层增加阅读难度。
*   **EN**:
    *   Extracts literal constants (strings, numbers) into a constant pool.
    *   Wraps constant access via chained calls to make it harder to understand.
    *   Can combine multiple intermediate layers to increase reading difficulty.
*   **Effect**: Weakens the readability of explicit constants, making static analysis harder.

### 2️⃣ jsPacker — JS 代码 Eval 加壳器
**JS Code Packer (Eval Wrapper)**

*   **CN**:
    *   将 JS 代码整体或部分包装成 `eval` 执行。
    *   生成初始化代码，在运行时执行真实逻辑。
    *   通过运行时解包，提高静态分析难度。
*   **EN**:
    *   Wraps the entire JS code or parts of it into `eval` execution.
    *   Generates initialization code to execute the real logic at runtime.
    *   Increases the difficulty of static analysis through runtime unpacking.
*   **Effect**: Similar to traditional packers, it increases the difficulty of reverse engineering by executing code at runtime.

### 3️⃣ registerReuse — 变量复用算法
**Register Reuse Algorithm**

*   **CN**:
    *   分析局部变量使用情况。
    *   尽可能合并或复用变量（寄存器分配思路）。
    *   减少最终代码中临时变量数量，混淆原有逻辑结构。
*   **EN**:
    *   Analyzes local variable usage.
    *   Merges or reuses variables wherever possible (similar to register allocation).
    *   Reduces the number of temporary variables in the final code.
*   **Effect**: Reduces code size while scrambling original variable structure, making logic tracking harder.

---
