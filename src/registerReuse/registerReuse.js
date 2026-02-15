const fs = require('fs'); // 文件输入输出
const parser = require("@babel/parser");// 解析js代码
const traverse = require("@babel/traverse").default;
const generator = require("@babel/generator").default;// 将ast转换成js代码
const transform = require("@babel/core").transform; // 转换api
const t = require("@babel/types");
/*
将定义语句拆分成单个定义语句。
变量复用的原则
1.两个变量必须在同一个父级作用域内(同一个函数作用域 或 同一个Program作用域)
2.复用变量的引用不能在子函数作用域内（影响函数内的值，闭包）
3.替换时，复用变量的生命周期已经结束（注意循环体）
4.不处理函数定义式
5.替换变量引用位置所在的作用域是循环作用域，那么复用变量的任意一个引用位置的父作用域恰好是这个循环作用域，此复用变量需要排除
* **/


function toES5(es6code){
    let code;
    const es5env = [
        "@babel/preset-env",
        {}
    ];
    try{
        code = transform(es6code, {
            presets: [es5env],
            sourceType:"script",
        }).code;
    }catch (e) {
        code = transform(es6code, {
            presets: [es5env],
            sourceType:"module",
        }).code;
    }
    // console.log(this.code);
    return code;
}
function preVar(ast){
    traverse(ast, {
        VariableDeclaration(path) {
            if (path.node.declarations.length <= 1)
                return;
            const nodes = path.node.declarations.map(d =>
                t.variableDeclaration("var", [d])
            );
            path.replaceWithMultiple(nodes);
        },
        ForStatement(path) {
            const init = path.node.init;
            if (!t.isVariableDeclaration(init)) return;
            if (init.kind !== "var") return;
            const varDecl = t.variableDeclaration(
                "var",
                init.declarations.map(decl =>
                    t.variableDeclarator(
                        t.cloneNode(decl.id),
                        decl.init
                    )
                )
            );
            const newFor = t.forStatement(
                null, // init removed
                path.node.test,
                path.node.update,
                path.node.body
            );
            const block = t.blockStatement([
                varDecl,
                newFor
            ]);
            path.replaceWith(block);
        },
        ForInStatement(path) {
            const left = path.node.left;
            if (!t.isVariableDeclaration(left)) return;
            if (left.kind !== "var") return;
            const declarator = left.declarations[0];
            const id = declarator.id;
            const varDecl = t.variableDeclaration("var", [
                t.variableDeclarator(t.cloneNode(id), null)
            ]);
            const newFor = t.forInStatement(
                t.cloneNode(id),
                path.node.right,
                path.node.body
            );
            const block = t.blockStatement([
                varDecl,
                newFor
            ]);
            path.replaceWith(block);
        },
    });
    traverse(ast,{// 收集父级作用域和循环作用域
        Program: {
            exit(path) {
              path.scope.crawl();
            }
        }
    });
    traverse(ast,{// 收集父级作用域和循环作用域
        enter(path){
            path.loopScope = [];
            path.parentScope = null;
            getParentScope(path);
        }
    });
    traverse(ast, {
      VariableDeclarator(path) {
          let {node,parentScope} = path;
          let {id,init} = node;
          let name = id.name;
          if(id === parentScope.bindings[name].identifier){
              return;
          }
          if(init){
            path.parentPath.replaceInline(t.expressionStatement(t.assignmentExpression('=', id, init)));
          }else{
            path.parentPath.replaceInline(
                t.emptyStatement());
          }
      }
    });
    return generator(ast).code;
}
function getParentScope(path) {
    let current = path;
    while (current) {
        // 如果爬到了顶级或者函数边界还没找到，说明不在同一个容器
        if (current.isFunction() || current.isProgram()) {
            break;
        }
        if (current.isLoop()) {// 当前path 是否在循环体内，如果在循环内，记录当前path的循环作用域
            path.loopScope.push(current.scope);
        }
        current = current.parentPath;
    }
    path.parentScope = current.scope;
}
function isChildFuncRef(references, parentScope){// 判断是否存在引用在子函数内
    for (let refPath of references) {
        if(refPath.type === "FunctionDeclaration"){// 特殊情况
            refPath = refPath.parentPath;
        }
        if(refPath.parentScope !== parentScope){
            return true;
        }
    }
    return false;
}
function hasCommon(arr1, arr2) {
    const set = new Set(arr1);
    return arr2.some(item => set.has(item));
}
function isBefore(pathA, pathB) {// 第一个元素是否在前
    return pathA.node.start <= pathB.node.end;
    // return pathA.node.start < pathB.node.start;
}

function run() {
    let jsCode = fs.readFileSync("./input.js") + "";
    let es5Code = toES5(jsCode);
    let ast = parser.parse(es5Code);
    let currentCode = preVar(ast);
    ast = parser.parse(currentCode);
    traverse(ast,{// 收集父级作用域和循环作用域
        enter(path){
            path.loopScope = [];
            path.parentScope = null;
            getParentScope(path);
            // console.log(path.node.name ,path.loopScope.length);
        }
    });
    traverse(ast,{
        VariableDeclarator(path){
            let {parentScope,node,scope} = path;
            let {bindings} = parentScope;
            let {id,init} = node;
            // console.log(id.name);
            let currentRefs = [];
            if (bindings[id.name].kind !== "var") return;// 可以删除
            let referencePaths = bindings[id.name].referencePaths;
            let constantViolations = bindings[id.name].constantViolations;
            for (let i = 0; i < referencePaths.length; i++) {
                currentRefs.push(referencePaths[i]);
            }
            for (let i = 0; i < constantViolations.length; i++) {
                currentRefs.push(constantViolations[i]);
            }
            currentRefs.push(path);// 自身所在的作用域
            for (const [name, binding] of Object.entries(bindings)) {
                // 同名排除
                if (name === id.name) continue;
                // 只能是var param 的才能复用，函数的不能复用
                if (!['var', 'param'].includes(binding.kind)) continue;

                // 收集引用位置
                let references = [];// 复用变量的引用
                let referencePaths = binding.referencePaths;// 复用变量的引用
                let constantViolations = binding.constantViolations;// 复用变量的引用
                for (let i = 0; i < referencePaths.length; i++) {
                    references.push(referencePaths[i]);
                }
                for (let i = 0; i < constantViolations.length; i++) {
                    references.push(constantViolations[i]);
                }
                references.push(binding.path);// 自身
                // 复用变量是否存在引用在子函数作用域内
                if(isChildFuncRef(references, parentScope)){
                    continue;
                }
                // 当前变量的所有引用所在的循环作用域不能存在该复用变量
                let flag = false;
                // 判断是否在循环作用域内
                for (let currentRefPath of currentRefs) {
                    let currentLoopScope = currentRefPath.loopScope;
                    if(currentLoopScope.length > 0){
                        for (const reference of references) {
                            let referenceLoopScope = reference.loopScope;
                            if(referenceLoopScope.length > 0){
                                // 此时存在相同循环作用域，需要排除
                                if(hasCommon(currentLoopScope,referenceLoopScope)){
                                    flag = true;
                                    break;
                                }
                            }
                        }
                        if(flag){
                            break;
                        }
                    }
                }
                if(flag){
                    continue;
                }
                // 判断当前定义位置与复用变量的所有引用之间的前后关系
                flag = false;
                for (let currentRefPath of currentRefs) {
                    for (const reference of references) {
                        if(!isBefore(reference,currentRefPath)){// 复用
                            flag = true;
                            break;
                        }
                    }
                    if(flag){
                        break;
                    }
                }
                if(flag){// 存在复用变量的引用不在当前变量的前面
                    continue;
                }
                console.log(`[Variable Reuse] '${id.name}' reuses  '${name}'`);
                // 全局重命名引用
                scope.rename(id.name, name);
                if(init){
                    // 将当前的 VariableDeclaration 替换为赋值表达式语句
                    path.parentPath.replaceInline(t.expressionStatement(t.assignmentExpression("=", t.identifier(name), init)));
                }else{
                    // console.log("应该设置为空语句");
                    path.parentPath.remove();
                }
                return;
            }
        }
    });
    currentCode = generator(ast).code;
    fs.writeFileSync("./output.js", currentCode + "\n");
    console.log(`Variable name reuse completed.`);
}
run();