function xorBuffer(buf, keyBuf) {
  if (!keyBuf || keyBuf.length === 0) throw new Error('Key must not be empty');
  const out = new Uint8Array(buf.length);
  for (let i = 0; i < buf.length; i++) {
    out[i] = buf[i] ^ keyBuf[i % keyBuf.length];
  }
  return out;
}
function rotateLeft(buf, shift) {
  const n = buf.length;
  if (n === 0) return new Uint8Array(0);
  shift = shift % n;
  const out = new Uint8Array(n);
  out.set(buf.slice(shift));
  out.set(buf.slice(0, shift), n - shift);
  return out;
}
function rotateRight(buf, shift) {
  const n = buf.length;
  if (n === 0) return new Uint8Array(0);
  shift = shift % n;
  const out = new Uint8Array(n);
  out.set(buf.slice(n - shift));
  out.set(buf.slice(0, n - shift), shift);
  return out;
}
function toBase64(uint8Array) {
  let binary = '';
  const len = uint8Array.length;
  for (let i = 0; i < len; i++) binary += String.fromCharCode(uint8Array[i]);
  return btoa(binary);
}
function fromBase64(base64) {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
function encrypt(plainStr, keyStr, rotate) {
  const enc = new TextEncoder();
  const data = enc.encode(plainStr);
  const key = enc.encode(keyStr);
  const step1 = xorBuffer(data, key);
  const step2 = rotateLeft(step1, rotate);
  const step3 = toBase64(step2);
  const step4 = step3.split('').reverse().join('');
  return step4;
}
function decrypt(encStr, keyStr, rotate) {
  const dec = new TextDecoder();
  const step1 = encStr.split('').reverse().join('');
  const step2 = fromBase64(step1);
  const step3 = rotateRight(step2, rotate);
  const key = new TextEncoder().encode(keyStr);
  const step4 = xorBuffer(step3, key);
  return dec.decode(step4);
}
function buildOutputJs(encrypted, key, rotate) {
  return `;eval(function(zo,oT,H,Ts,Ns,zt,nz,IJ){return zo=${JSON.stringify(encrypted)},oT=${JSON.stringify(key)},H=${rotate},Ts=function(nn){return nn.split('').reverse().join('')},Ns=function(zg){if(typeof Buffer!=='undefined'&&Buffer.from){return Buffer.from(zg,'base64')}else if(typeof atob!=='undefined'){var Tn=atob(zg),aI=new Uint8Array(Tn.length);for(var NT=0;NT<Tn.length;NT++){aI[NT]=Tn.charCodeAt(NT)}return aI}},zt=function(Nt,nI){var ag=Nt.length;if(!ag)return Nt;nI=nI%ag;return Nt.slice(ag-nI).concat(Nt.slice(0,ag-nI))},nz=function(Nt,ac,kk,tN){kk=Array.from(ac).map(function(IT){return IT.charCodeAt(0)}),tN=new Array(Nt.length);for(var NT=0;NT<Nt.length;NT++)tN[NT]=Nt[NT]^kk[NT%kk.length];return tN},IJ=function(Nt){if(typeof Buffer!=='undefined'&&Buffer.from){return Buffer.from(Nt).toString('utf8')}else if(typeof TextDecoder!=='undefined'){return new TextDecoder('utf-8').decode(new Uint8Array(Nt));}return String.fromCharCode.apply(null,Nt)},function(IH,ko,In,ta,aq,nN,PJ){return ta=Ts(IH),aq=Array.from(Ns(ta)),nN=zt(aq,In),PJ=nz(nN,ko),IJ(PJ)}(zo,oT,H)}());`;
}
function obfuscate(code){
  const key = (Math.random()*1000000000|0).toString(36);
  const rotate = Math.random() * 6 | 0;
  const encrypted = encrypt(code, key, rotate);
  return buildOutputJs(encrypted, key, rotate);
}

function main() {
  const fs = require('fs');
  const jsCode = fs.readFileSync("./input.js") + "";
  const retCode = obfuscate(jsCode);
  fs.writeFileSync("./output.js", retCode + "\n", (err) => {});
  console.log("jsPacker ==>","Obfuscation completed successfully");
}
main();