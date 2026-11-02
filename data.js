// 课程数据：与 ../振动波动光学_课程大纲.md 保持一致
const R = String.raw;

window.COURSE = {
  meta: {
    updated: "2026-11-02",
    totalHours: 58,
    minimalHours: 37,
    reviewCount: 20,
  },

  chapters: [
    { id: "osc", name: "机械振动", no: "第一章", en: "Oscillation" },
    { id: "wave", name: "机械波动", no: "第二章", en: "Mechanical Waves" },
    { id: "optics", name: "波动光学", no: "第三章", en: "Wave Optics" },
  ],

  tags: {
    基: "必须掌握的基础",
    频: "高频（经验判断）",
    混: "容易混淆",
    推: "重点推导",
    拓: "拓展 / 了解",
  },

  phaseBand: [
    { stage: "振动", ch: "osc", obj: "一个点", phase: R`$\omega t+\varphi$`, formula: R`$x=A\cos(\omega t+\varphi)$`, q: "相位怎样随时间变化" },
    { stage: "波动", ch: "wave", obj: "一串点", phase: R`$\omega t-kx+\varphi$`, formula: R`$y=A\cos\!\left[\omega\!\left(t-\tfrac{x}{u}\right)+\varphi\right]$`, q: "相位怎样随位置落后" },
    { stage: "干涉", ch: "wave", obj: "两列波相遇", phase: R`$\Delta\varphi=\Delta\varphi_0-\tfrac{2\pi}{\lambda}\Delta r$`, formula: R`$A^2=A_1^2+A_2^2+2A_1A_2\cos\Delta\varphi$`, q: "相位差决定加强还是减弱" },
    { stage: "光的干涉", ch: "optics", obj: "光波", phase: R`$\Delta\varphi=\tfrac{2\pi}{\lambda}\delta$`, formula: R`$\Delta x=\tfrac{D\lambda}{d}$`, q: "几何路程差换成光程差" },
    { stage: "衍射", ch: "optics", obj: "无数子波", phase: "子波相位连续分布", formula: R`$a\sin\theta=\pm k\lambda$（暗）`, q: "无限多束光的干涉" },
    { stage: "偏振", ch: "optics", obj: "光矢量方向", phase: "不看相位，看振动方向", formula: R`$I=I_0\cos^2\alpha$`, q: "证明光是横波" },
  ],

  // col：知识地图中的列位置；pre：真正的先修依赖
  lessons: [
    { id: "L1", ch: "osc", col: 0, short: "动力学方程", title: "简谐振动的定义与动力学方程", core: R`回复力 · 弹簧振子 · $\ddot x+\omega^2x=0$ 及其解`, math: 3, exam: 4, review: 0, hours: 2.5, tags: ["基", "推"], minimal: true, pre: [] },
    { id: "L2", ch: "osc", col: 1, short: "运动学方程", title: "运动学方程与特征量", core: R`由初始条件定 $A,\varphi$ · $v$、$a$ 的相位与图像`, math: 2, exam: 5, review: 1, hours: 2, tags: ["基", "频", "混"], minimal: true, pre: ["L1"], lab: "shm" },
    { id: "L3", ch: "osc", col: 2, short: "旋转矢量", title: "相位与旋转矢量法", core: "相位差 · 定初相 · 求时间间隔", math: 2, exam: 5, review: 2, hours: 2, tags: ["频", "混"], minimal: true, gate: true, pre: ["L2"], lab: "shm" },
    { id: "L4", ch: "osc", col: 3, short: "能量·单摆", title: "能量 + 其他简谐系统", core: R`$E=\tfrac12kA^2$ · 单摆 · 竖直弹簧振子 · 复摆（拓）`, math: 3, exam: 4, review: 1, hours: 2, tags: ["基", "推", "混"], minimal: true, pre: ["L1", "L2"] },
    { id: "L5", ch: "osc", col: 4, short: "振动合成", title: "同方向振动合成与拍", core: "合振幅公式 · 同相 / 反相 · 拍频", math: 3, exam: 4, review: 0, hours: 2, tags: ["频", "推"], minimal: true, pre: ["L3"], lab: "superpose" },
    { id: "L6", ch: "osc", col: 5, short: "阻尼受迫", title: "垂直合成；阻尼、受迫、共振", core: "椭圆轨迹 · 三种阻尼 · 受迫稳态频率", math: 2, exam: 2, review: 0, hours: 1.5, tags: ["拓", "混"], pre: ["L5"] },
    { id: "C1", ch: "osc", review: null, title: "第一章专项训练与章测", core: "结构图 · 公式表 · 题型 · 测验", hours: 2, checkpoint: true },

    { id: "L7", ch: "wave", col: 0, short: "波的基本量", title: "机械波的产生与基本量", core: R`横波 / 纵波 · $u=\lambda\nu$ · 谁决定 $u$、谁决定 $\nu$`, math: 1, exam: 3, review: 0, hours: 1.5, tags: ["基", "混"], minimal: true, pre: ["L1"] },
    { id: "L8", ch: "wave", col: 1, short: "波函数", title: "平面简谐波的波函数", core: "建立 · 物理意义 · 参考点不在原点 · 两点相位差", math: 3, exam: 5, review: 2, hours: 2.5, tags: ["基", "频", "推"], minimal: true, gate: true, pre: ["L2", "L7"], lab: "wave" },
    { id: "L9", ch: "wave", col: 2, short: "波形图", title: "波形图与振动图", core: "判断运动方向 · 由图写方程", math: 3, exam: 5, review: 3, hours: 2.5, tags: ["频", "混"], minimal: true, gate: true, pre: ["L8", "L3"], lab: "wave" },
    { id: "L10", ch: "wave", col: 3, short: "波的能量", title: "波的能量 + 惠更斯原理", core: R`$\mathrm dW_k=\mathrm dW_p$ · 强度 · 子波作图`, math: 3, exam: 3, review: 0, hours: 2, tags: ["混", "推"], pre: ["L4", "L8"] },
    { id: "L11", ch: "wave", col: 4, short: "波的干涉", title: "波的叠加与干涉", core: R`相干条件 · $\Delta\varphi$ 公式 · 加强减弱`, math: 3, exam: 5, review: 0, hours: 2.5, tags: ["频", "推"], minimal: true, gate: true, pre: ["L5", "L8"] },
    { id: "L12", ch: "wave", col: 5, short: "驻波", title: "驻波与半波损失", core: "驻波方程 · 波节波腹 · 半波损失 · 弦的本征频率", math: 4, exam: 4, review: 0, hours: 2.5, tags: ["频", "推", "混"], minimal: true, pre: ["L11"], lab: "standing" },
    { id: "L13", ch: "wave", col: 6, short: "多普勒", title: "多普勒效应", core: "通式与符号约定 · 两种运动的本质区别", math: 2, exam: 3, review: 0, hours: 1.5, tags: ["频", "混"], pre: ["L7"] },
    { id: "C2", ch: "wave", review: null, title: "第二章专项训练与章测", core: "结构图 · 公式表 · 题型 · 测验", hours: 2.5, checkpoint: true },

    { id: "L14", ch: "optics", col: 3, short: "光程差", title: "相干性、光程与光程差", core: "获得相干光的方法 · 光程 · 光学中的半波损失", math: 2, exam: 5, review: 0, hours: 2, tags: ["基", "频", "混"], minimal: true, gate: true, pre: ["L11", "L12"] },
    { id: "L15", ch: "optics", col: 4, short: "杨氏双缝", title: "杨氏双缝干涉", core: "条纹位置与间距 · 插片移动 · 光强分布", math: 2, exam: 5, review: 2, hours: 2, tags: ["基", "频"], minimal: true, pre: ["L14"], lab: "diffraction" },
    { id: "L16", ch: "optics", col: 5, short: "薄膜干涉", title: "薄膜干涉", core: "判断半波损失 · 增透膜 / 增反膜", math: 3, exam: 4, review: 1, hours: 2, tags: ["推", "混"], minimal: true, pre: ["L14", "L12"], lab: "thinfilm" },
    { id: "L17", ch: "optics", col: 6, short: "劈尖牛顿环", title: "等厚干涉：劈尖与牛顿环", core: "厚度差 · 条纹间距 · 牛顿环半径", math: 3, exam: 5, review: 1, hours: 2.5, tags: ["频", "推"], minimal: true, pre: ["L16"], lab: "thinfilm" },
    { id: "L18", ch: "optics", col: 7, short: "迈克耳孙", title: "迈克耳孙干涉仪", core: R`等效薄膜 · $\Delta d=N\lambda/2$ · 插片`, math: 2, exam: 3, review: 0, hours: 1.5, tags: ["频"], pre: ["L16"] },
    { id: "L19", ch: "optics", col: 8, short: "单缝衍射", title: "惠更斯–菲涅耳原理 + 单缝衍射", core: "半波带法 · 明暗纹条件 · 中央明纹宽度", math: 3, exam: 5, review: 3, hours: 2.5, tags: ["频", "推", "混"], minimal: true, pre: ["L10", "L14"], lab: "diffraction" },
    { id: "L20", ch: "optics", col: 9, short: "圆孔分辨", title: "圆孔衍射与分辨本领", core: "爱里斑 · 最小分辨角", math: 2, exam: 3, review: 0, hours: 1.5, tags: [], pre: ["L19"] },
    { id: "L21", ch: "optics", col: 10, short: "光栅", title: "光栅衍射", core: "光栅方程 · 缺级 · 最高级次 · 光谱重叠", math: 3, exam: 5, review: 2, hours: 2.5, tags: ["基", "频", "混"], minimal: true, pre: ["L15", "L19"], lab: "diffraction" },
    { id: "L22", ch: "optics", col: 11, short: "马吕斯", title: "偏振光与马吕斯定律", core: R`三类光 · 起偏检偏 · $I=I_0\cos^2\alpha$`, math: 1, exam: 4, review: 2, hours: 1.5, tags: ["基", "频", "混"], minimal: true, pre: ["L7"], lab: "polar" },
    { id: "L23", ch: "optics", col: 12, short: "布儒斯特", title: "布儒斯特定律 + 双折射", core: "反射起偏 · o 光与 e 光（了解）", math: 2, exam: 3, review: 0, hours: 1.5, tags: ["频", "混", "拓"], pre: ["L22"], lab: "polar" },
    { id: "C3", ch: "optics", review: null, title: "第三章专项训练与章测", core: "结构图 · 公式表 · 题型 · 测验", hours: 3, checkpoint: true },
    { id: "Z", ch: "all", review: null, title: "三章综合 + 模拟卷 + 薄弱点清单", core: "知识网络 · 公式手册 · 综合模拟", hours: 4, checkpoint: true },
  ],

  labs: [
    { id: "shm", name: "旋转矢量", sub: "简谐振动", lessons: "L2–L3" },
    { id: "superpose", name: "振动合成", sub: "同频合成与拍", lessons: "L5" },
    { id: "wave", name: "平面简谐波", sub: "波形图 vs 振动图", lessons: "L8–L9" },
    { id: "standing", name: "驻波", sub: "半波损失", lessons: "L12" },
    { id: "diffraction", name: "双缝·单缝·光栅", sub: "干涉与衍射", lessons: "L15 · L19 · L21" },
    { id: "thinfilm", name: "劈尖·牛顿环", sub: "等厚干涉", lessons: "L16–L17" },
    { id: "polar", name: "偏振", sub: "马吕斯 · 布儒斯特", lessons: "L22–L23" },
  ],

  tree: [
    {
      ch: "osc",
      sections: [
        { name: "1.1 基本概念", items: [
          { t: "平衡位置、周期性运动" },
          { t: R`回复力 $F=-kx$`, g: ["基"] },
          { t: "判定三法：看力的形式 / 看微分方程 / 看运动方程", g: ["基", "频"] },
        ] },
        { name: "1.2 动力学", items: [
          { t: R`弹簧振子：$\ddot x+\omega^2x=0$，$\omega=\sqrt{k/m}$`, g: ["基", "推"] },
          { t: "为什么解是余弦形式", g: ["推"] },
          { t: "竖直弹簧振子：以新平衡位置为原点仍是简谐振动", g: ["混"] },
          { t: R`单摆（小角近似）：$\omega=\sqrt{g/l}$`, g: ["基", "推"] },
          { t: R`复摆：$\omega=\sqrt{mgh/J}$`, g: ["拓"] },
        ] },
        { name: "1.3 运动学", items: [
          { t: R`$x=A\cos(\omega t+\varphi)$`, g: ["基"] },
          { t: R`$\omega$ 由系统决定，$A$、$\varphi$ 由初始条件决定`, g: ["频"] },
          { t: R`$A=\sqrt{x_0^2+v_0^2/\omega^2}$，$\tan\varphi=-\dfrac{v_0}{\omega x_0}$（结合 $v_0$ 的符号定象限）`, g: ["频", "混"] },
          { t: R`$v$ 超前 $x$ 相位 $\pi/2$；$a=-\omega^2x$，与 $x$ 反相`, g: ["基"] },
          { t: R`$x$–$t$、$v$–$t$、$a$–$t$ 图像` },
        ] },
        { name: "1.4 相位与旋转矢量", items: [
          { t: "相位差：同相、反相、超前、落后", g: ["混"] },
          { t: "用旋转矢量定初相、求时间间隔", g: ["频"] },
        ] },
        { name: "1.5 能量", items: [
          { t: R`$E=\tfrac12kA^2$，机械能守恒`, g: ["基"] },
          { t: R`$\overline{E_k}=\overline{E_p}=E/2$；$E_k$、$E_p$ 的变化频率是 $2\nu$`, g: ["混"] },
        ] },
        { name: "1.6 振动的合成", items: [
          { t: R`同方向同频率：$A=\sqrt{A_1^2+A_2^2+2A_1A_2\cos(\varphi_2-\varphi_1)}$`, g: ["频", "推"] },
          { t: R`拍：$\nu_{\text{拍}}=|\nu_2-\nu_1|$`, g: ["混"] },
          { t: "相互垂直、同频率：轨迹是椭圆" },
          { t: "李萨如图形", g: ["拓"] },
        ] },
        { name: "1.7 阻尼、受迫与共振", items: [
          { t: "欠阻尼 / 临界阻尼 / 过阻尼" },
          { t: "受迫振动稳定后频率 = 驱动力频率", g: ["混"] },
          { t: R`位移共振 $\omega_r=\sqrt{\omega_0^2-2\beta^2}$`, g: ["拓"] },
        ] },
      ],
    },
    {
      ch: "wave",
      sections: [
        { name: "2.1 产生与基本量", items: [
          { t: "产生条件：波源 + 弹性介质", g: ["基"] },
          { t: "横波、纵波；流体内部只传纵波" },
          { t: R`$u=\lambda\nu$：$u$ 由介质决定，$\nu$ 由波源决定`, g: ["基", "混"] },
          { t: "波线、波面、波前" },
        ] },
        { name: "2.2 平面简谐波", items: [
          { t: R`$y=A\cos\!\left[\omega\!\left(t\mp\tfrac{x}{u}\right)+\varphi\right]$ 的建立`, g: ["基", "频", "推"] },
          { t: R`参考点不在原点：$y=A\cos\!\left[\omega\!\left(t-\tfrac{x-x_0}{u}\right)+\varphi_0\right]$`, g: ["频"] },
          { t: R`固定 $x$ → 振动方程；固定 $t$ → 波形；都变 → 波形平移` },
          { t: R`质点振动速度 $\partial y/\partial t$ 与波速 $u$ 的区别`, g: ["混"] },
          { t: R`沿传播方向两点的相位差 $2\pi\Delta x/\lambda$`, g: ["频"] },
        ] },
        { name: "2.3 波形图与振动图", items: [
          { t: R`横轴是 $x$ 还是 $t$`, g: ["混"] },
          { t: "判断质点运动方向", g: ["频"] },
          { t: "由图写出方程", g: ["频"] },
        ] },
        { name: "2.4 能量", items: [
          { t: R`体积元 $\mathrm dW_k=\mathrm dW_p$，同步变化，平衡位置处最大`, g: ["混", "推"] },
          { t: R`$\bar w=\tfrac12\rho A^2\omega^2$` },
          { t: R`强度 $I=\tfrac12\rho A^2\omega^2u$` },
        ] },
        { name: "2.5 惠更斯原理", items: [
          { t: "子波作图；定性解释衍射、反射、折射" },
        ] },
        { name: "2.6 叠加与干涉", items: [
          { t: "相干条件：同频率、同振动方向、相位差恒定", g: ["基"] },
          { t: R`$\Delta\varphi=\varphi_2-\varphi_1-\tfrac{2\pi}{\lambda}(r_2-r_1)$`, g: ["频", "推"] },
          { t: R`加强 $\Delta\varphi=\pm2k\pi$；减弱 $\Delta\varphi=\pm(2k+1)\pi$`, g: ["频"] },
        ] },
        { name: "2.7 驻波", items: [
          { t: R`$y=2A\cos\tfrac{2\pi x}{\lambda}\cos\omega t$`, g: ["推"] },
          { t: R`波节、波腹位置；相邻波节相距 $\lambda/2$`, g: ["频"] },
          { t: "两节点之间同相，节点两侧反相；能量不定向传播", g: ["混"] },
          { t: "半波损失：波疏 → 波密反射，反射点为波节", g: ["频", "混"] },
          { t: R`两端固定弦：$\nu_n=\dfrac{nu}{2L}$` },
        ] },
        { name: "2.8 多普勒效应", items: [
          { t: R`$\nu'=\dfrac{u+v_o}{u-v_s}\nu$（相互靠近时 $v_o$、$v_s$ 取正）`, g: ["频", "混"] },
          { t: "冲击波、马赫锥", g: ["拓"] },
        ] },
      ],
    },
    {
      ch: "optics",
      sections: [
        { name: "3.1 波动性与相干性", items: [
          { t: R`光矢量 $\vec E$；可见光约 400–760 nm` },
          { t: "两个独立的普通光源不相干", g: ["基"] },
          { t: "获得相干光：分波阵面、分振幅", g: ["基"] },
        ] },
        { name: "3.2 光程", items: [
          { t: R`光程 $nr$；介质中波长 $\lambda_n=\lambda/n$`, g: ["混"] },
          { t: R`$\Delta\varphi=2\pi\delta/\lambda$（$\lambda$ 为真空波长）`, g: ["频"] },
          { t: "透镜不产生附加光程差" },
          { t: "半波损失：光疏 → 光密的反射光有，透射光没有", g: ["频", "混"] },
        ] },
        { name: "3.3 杨氏双缝", items: [
          { t: R`$\Delta x=\dfrac{D\lambda}{d}$`, g: ["基", "频"] },
          { t: R`$I=4I_0\cos^2(\Delta\varphi/2)$` },
          { t: R`插入薄片后条纹移动 $N$ 级：$(n-1)e=N\lambda$`, g: ["频"] },
          { t: "劳埃德镜", g: ["拓"] },
        ] },
        { name: "3.4 薄膜干涉", items: [
          { t: R`垂直入射：$\delta=2n_2e\ (+\lambda/2)$`, g: ["推", "混"] },
          { t: "增透膜、增反膜", g: ["频"] },
          { t: "等倾干涉", g: ["拓"] },
        ] },
        { name: "3.5 等厚干涉", items: [
          { t: R`劈尖：相邻条纹厚度差 $\dfrac{\lambda}{2n}$，间距 $l\approx\dfrac{\lambda}{2n\theta}$`, g: ["频"] },
          { t: R`牛顿环（反射、空气膜）：暗环 $r=\sqrt{kR\lambda}$，明环 $r=\sqrt{(k-\tfrac12)R\lambda}$`, g: ["频", "推"] },
        ] },
        { name: "3.6 迈克耳孙干涉仪", items: [
          { t: R`动镜移动 $\Delta d=N\lambda/2$；插入薄片 $2(n-1)e=N\lambda$`, g: ["频"] },
        ] },
        { name: "3.7 衍射", items: [
          { t: R`单缝（半波带法）：暗纹 $a\sin\theta=\pm k\lambda$，明纹 $a\sin\theta\approx\pm(2k+1)\tfrac{\lambda}{2}$`, g: ["频", "推", "混"] },
          { t: R`中央明纹线宽度 $2f\lambda/a$，是其他明纹的 2 倍`, g: ["频"] },
          { t: R`圆孔：最小分辨角 $\theta_R=1.22\lambda/D$` },
        ] },
        { name: "3.8 光栅", items: [
          { t: R`光栅方程 $d\sin\theta=\pm k\lambda$`, g: ["基", "频"] },
          { t: R`缺级：$k=\dfrac{d}{a}k'$`, g: ["频", "混"] },
          { t: R`最高级次：$k<d/\lambda$`, g: ["频"] },
          { t: "光谱重叠", g: ["频"] },
          { t: R`分辨本领 $R=kN$、布拉格公式 $2d\sin\theta=k\lambda$`, g: ["拓"] },
        ] },
        { name: "3.9 偏振", items: [
          { t: "自然光、线偏振光、部分偏振光", g: ["基"] },
          { t: "自然光过一个偏振片后光强减半", g: ["频", "混"] },
          { t: R`马吕斯定律 $I=I_0\cos^2\alpha$`, g: ["基", "频"] },
          { t: R`布儒斯特：$\tan i_B=n_2/n_1$，反射光线偏振，折射光部分偏振，$i_B+\gamma=90^\circ$`, g: ["频", "混"] },
          { t: "双折射：o 光、e 光、光轴", g: ["拓"] },
        ] },
      ],
    },
  ],

  core: [
    { t: R`简谐振动的动力学判定 $\ddot x+\omega^2x=0$`, why: R`判断系统是否简谐、求 $\omega$ 的唯一可靠方法`, at: "L1 · L4" },
    { t: "定初相与旋转矢量法", why: "振动、波动、干涉题的共同入口", at: "L2 · L3" },
    { t: "同方向同频率振动的合成", why: "干涉在数学上的原型", at: "L5" },
    { t: "平面简谐波的波函数", why: "第二章所有计算都围绕它", at: "L8" },
    { t: "波形图 ↔ 振动图 ↔ 波函数", why: "第二章计算题的主体", at: "L9" },
    { t: "相位差与干涉加强 / 减弱条件", why: "连接机械波与光波的桥梁", at: "L11" },
    { t: "驻波与半波损失", why: "半波损失直接用于光学薄膜题", at: "L12" },
    { t: "光程差（含半波损失判断）", why: "双缝、薄膜、劈尖、牛顿环、迈克耳孙同一套方法", at: "L14–L18" },
    { t: "单缝衍射与光栅方程（含缺级）", why: "衍射部分计算题的主体", at: "L19 · L21" },
    { t: "马吕斯定律与布儒斯特定律", why: "几乎涵盖偏振的全部考点", at: "L22 · L23" },
  ],

  mistakes: [
    { wrong: R`$\tan\varphi$ 算出来的角就是初相`, right: R`$\tan$ 在一个周期内有两个解，要用 $x_0$、$v_0$ 的符号（或旋转矢量）确定象限。` },
    { wrong: "波速就是质点运动的速度", right: R`$u$ 由介质决定，是常量；质点振动速度 $\partial y/\partial t$ 随时间变化，方向与传播方向垂直（横波）。` },
    { wrong: "波形图和振动图读法一样", right: R`横轴分别是 $x$ 和 $t$；判断运动方向的方法完全不同。` },
    { wrong: R`$t-x/u$ 的正负号可以随便写`, right: R`沿 $+x$ 传播用减号（越远相位越落后）；参考点不在原点时写成 $x-x_0$。` },
    { wrong: "波中质元的动能和势能此消彼长", right: "两者同步变化，在平衡位置同时最大；单个质元机械能不守恒，能量在传递。" },
    { wrong: "驻波各点的相位依次落后", right: "相邻两节点之间各点同相，节点两侧反相；驻波不定向传播能量。" },
    { wrong: "只要有反射就有半波损失", right: "只有光疏 → 光密的反射光才有；透射光没有；两个界面都有时互相抵消。" },
    { wrong: "光程差就是几何路程差", right: R`光程是 $nr$；$\Delta\varphi=2\pi\delta/\lambda$ 中的 $\lambda$ 是真空波长。` },
    { wrong: R`单缝中 $a\sin\theta=k\lambda$ 是明纹`, right: "单缝中这是暗纹条件，与双缝 / 光栅的明纹条件写法相同、含义相反；中央明纹宽度是其他明纹的 2 倍。" },
    { wrong: R`自然光过偏振片也用 $I_0\cos^2\alpha$`, right: R`自然光过第一个偏振片后光强变为 $I_0/2$；马吕斯定律只适用于入射光已是线偏振光。` },
  ],

  extraMistakes: [
    R`拍频是 $|\nu_2-\nu_1|$，不是它的一半`,
    R`光栅 $k=d/\lambda$ 对应 $\theta=90^\circ$，该级看不到`,
  ],

  evidence: [
    "星级 = 一般大学物理教学经验判断，不是学校真实考试统计。",
    "「复习题」= 文件夹 来自复习题/ OCR 文本中识别出的同类题数，去重后共 20 题（振动 4、波动 5、光学 11）。这是复习题集，不是期末卷。",
    "24-25 普物A1 期末卷中这三章 0 题，可能在另一学期考，待确认。",
    "学习时间为估计值（⚠️待验证），学完前两课后按实际速度校准。",
  ],
};
