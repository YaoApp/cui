import './spinner.less'

/* 旋转指示器的形状：**两瓣四分之一弧，互成 180°**，每瓣头端圆帽、尾端收尖（阴阳鱼的两瓣）。
   只画一瓣时轮廓读不出圆，转起来显得空；两瓣互成 180°，既读得出圆，又留出两段空隙看得出在转。
   形状必须用填充路径画：边框的端头由斜接决定，只能得到平口或尖口，做不出圆帽。
   尺寸、颜色与旋转都由设计类 `.spinner` 给（16×16、`fill: currentColor`），这里只管形状与坐标系。
   坐标系 16×16：圆心 (8,8)，外弧半径 6.5；头端圆帽半径 1.5（弧宽 3）；
   尾端由二次曲线把半径从 3.5 收到外弧端点，于是收成尖。 */
const LOBE = 'M1.5 8 A6.5 6.5 0 0 1 8 1.5 A1.5 1.5 0 0 1 8 4.5 Q3.2 5.4 1.5 8 Z'

export function Spinner() {
  return (
    <svg className="spinner" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d={LOBE} />
      <path d={LOBE} transform="rotate(180 8 8)" />
    </svg>
  )
}
