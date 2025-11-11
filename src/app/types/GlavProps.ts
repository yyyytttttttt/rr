

export type button ={label:string,variant:string}
export type DescProps ={
  title:string | string[]
  lines:string[]
  buttons:button[]
  pos:'left' |'right'
}
export type MobileButton ={
  label:string
  variant: 'primary' | 'ghost'
}
export type mobileBarType = {
  title:string | string[]
  text:string[]
  buttons:button[]
  
}
export type ComponentSlide ={
  type: 'component'; 
  component: 'Fsection'
  id:string

}
export type Slider2 ={
  id:string
  type:'slider2'
  desktop:DescProps
  mobile:mobileBarType
}
export type StaticSlide = {
  type:'static'
  images: { default: string; xs: string; oneK: string; fourXL: string }
  desktop:DescProps
  mobile:mobileBarType
  src?: string
  
  id:string
  

}
 export type Slide = ComponentSlide | Slider2 | StaticSlide