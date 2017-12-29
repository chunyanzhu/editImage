<template>
<div class="mrt20">
	<div class="edit-panel">
		<div class="edit-tools">
			<button @click="addText()" class="green_button"><i class="fa fa-pencil-square-o mrr5"></i>增加文字</button>
			<button @click="showPrevLayer()" class="green_button"><i class="fa fa-search mrr5"></i>预览</button>
			<!-- <select v-model="currentText.family" @change="onWatch('family')">
				<option v-for="item in fontsMaps" :value="item.val" :style="{fontFamily: item.val}">{{item.text}}</option>
			</select> -->
			<drop-down :value="currentText.family" :list="fontsMaps" :callback="setCurrentFamily" :disabled="editAble" z-index="20" ref="currentFamilySelect" class="fontSelect"></drop-down>
			<span>字号：</span><input type="number" id="fontSize" :disabled="!!editAble" v-model.number="currentText.size" max="150" min="12" @change="onWatch('size')">
			<a class="button" :class="{'active': currentText.weight == 'bold'}" @click="onActive(currentText, 'weight')"><b>B</b></a>
			<a class="button" :class="{'active': currentText.style == 'italic'}" @click="onActive(currentText, 'style')"><i>I</i></a>
			<input type="color" id="fontColor" :disabled="!!editAble" v-model="currentText.color" style="cursor: pointer;" @change="onWatch('color')">
			<input type="text" id="fontColorInput" :disabled="!!editAble" v-model="currentText.color" @change="onWatch('color')" maxlength="7">
			<span>x：</span><input type="number" v-model="currentText.x" @change="onMove(currentText)">
			<span>y：</span><input type="number" v-model="currentText.y" @change="onMove(currentText)">
		</div>
		<div class="edit-box">
			<div class="edit-image">
				<div v-for="(input, index) in listText" v-drag="{mX: imgW, mY: imgH, fn: greet}" class="edit-input"
					:class="{'bold': input.weight =='bold', 'italic': input.style == 'italic', 'active': input.selected}" tabindex="1"
					@focus="onSelect(input, index)"  @dblclick="onInput($event, input)" @keyup.up="onUp(input, $event)" @keyup.down="onDown(input, $event)" @keyup.left="onLeft(input, $event)" @keyup.right="onRight(input, $event)" :style="{top: input.y + 'px',left: input.x + 'px'}">
					<span :style="{fontFamily: input.family ,fontSize: input.size + 'px',color: input.color, opacity: 0}">{{input.content || '双击输入文案'}}</span>
					<canvas></canvas>
					<input type="text" class="edit_input" maxlength="100" v-model="input.content" @blur="onBlur($event, input)"/>{{input.selected + '--------'}}
					<a href="javascript:;" class="del_icon" v-show="!editAble && input.selected" @click.stop="delText(index)">x</a>
				</div>
				<img v-if="imgUrl" :src="imgUrl" @load="imgOnload()"/>
			</div>
		</div>
	</div>
	<Modal
		:show="prevLayerShow" 
        @hide="hidePrevLayer()" 
        :mask="true" 
        :close-button="true"
        :close-able="true"
        title="图片预览"
        :width="800"
        :height="450"
        v-cloak
	>
		<div class="prev_box" style="padding: 0 10px;">
			<canvas id="prevImgCanvas"></canvas>
		</div>
	</Modal>
</div>
</template>
<script>
	var getTextTop = (text,fontsize,fontface)=>{
	    // create temp working canvas
	    var c=document.createElement('canvas');
	    var w=c.width;
	    var h=fontsize*2;
	    c.width=w;
	    c.height=h;
	    var cctx=c.getContext('2d');
	    // set font styles
	    cctx.textBaseline='top';
	    cctx.font=fontsize+'px '+fontface;
	    cctx.fillStyle='red';
	    // draw the text
	    cctx.fillText(text,0,0);
	    // get pixel data
	    var imgdata=cctx.getImageData(0,0,w,h);
	    var d=imgdata.data;
	    // scan pixel data for minX,minY
	    var minX=10000000;
	    var minY=minX;
	    for(var y=0;y<h;y++){
	    for(var x=0;x<w;x++){
	        var n=(y*w+x)*4
	        if(d[n+3]>0){
	            if(y<minY){minY=y;}
	            if(x<minX){minX=x;}
	        }
	    }}
	    // return the leftmost & topmost pixel of the text
	    return({x:minX,y:minY});
	};
	var getBrowserType = () => {
	    var userAgent = navigator.userAgent; //取得浏览器的userAgent字符串
	    var isOpera = userAgent.indexOf("Opera") > -1; //判断是否Opera浏览器
	    var isIE = userAgent.indexOf("compatible") > -1 && userAgent.indexOf("MSIE") > -1 && !isOpera; //判断是否IE浏览器
	    var isFF = userAgent.indexOf("Firefox") > -1; //判断是否Firefox浏览器
	    var isSafari = userAgent.indexOf("Safari") > -1; //判断是否Safari浏览器
		var isChrome = userAgent.indexOf("Chrome") > -1; //判断是否Safari浏览器
	    if (isIE) {
	        var IE5 = IE55 = IE6 = IE7 = IE8 = false;
	        var reIE = new RegExp("MSIE (\\d+\\.\\d+);");
	        reIE.test(userAgent);
	        var fIEVersion = parseFloat(RegExp["$1"]);
	        return {"type":"IE","version":Number(fIEVersion)};
	    }//isIE end
	    if (isFF) {
	        return {"type":"FF"};
	    }
	    if (isOpera) {
	        return {"type":"Opera"};
	    }
		if(isChrome){
			return {"type":"Chrome"};
		}
		if(!isIE && !isFF && !isOpera && !isChrome){
			if(isIEBrower()){
				//ie11的判断
				return {"type":"IE","version":11};
			}
		}
		function isIEBrower() { //ie11的判断
			 if (!!window.ActiveXObject || "ActiveXObject" in window){
				 return true;
			 }else{
				 return false;
			 }
		}
	};
	var fontsMaps = [
		{
			value: '微软雅黑,Microsoft YaHei',
			text: '微软雅黑',
			familyIdx: '1'
		},
		{
			value: '黑体,SimHei',
			text: '黑体',
			familyIdx: '2'
		},
		{
			value: '宋体,SimSun',
			text: '宋体',
			familyIdx: '3'
		},
		{
			value: '华文彩云,STCaiyun',
			text: '华文彩云',
			familyIdx: '4'
		},
		{
			value: '幼圆,YouYuan',
			text: '幼圆',
			familyIdx: '5'
		},
		{
			value: '华文琥珀,STHupo',
			text: '华文琥珀',
			familyIdx: '6'
		},
		{
			value: '楷体,楷体_GB2312,SimKai',
			text: '楷体',
			familyIdx: '7'
		},
		{
			value: '方正兰亭纤黑简体,FZLanTingHeiS-EL-GB',
			text: '方正兰亭纤黑简体',
			familyIdx: '8'
		},
		{
			value: "方正兰亭中黑简体,FZLanTingHeiS-DB-GB",
			text: '方正兰亭中黑简体',
			familyIdx: '9'
		},
		{
			value: "方正兰亭特黑简体,FZLanTingHeiS-H-GB",
			text: '方正兰亭特黑简体',
			familyIdx: '10'
		},
		{
			value: "方正正大黑简体,FZZhengHeiS-EB-GB",
			text: '方正正大黑简体',
			familyIdx: '11'
		},
		{
			value: "方正正中黑简体,FZZhengHeiS-DB-GB",
			text: '方正正中黑简体',
			familyIdx: '12'
		},
		{
			value: "方正正准黑简体,FZZhengHeiS-M-GB",
			text: '方正正准黑简体',
			familyIdx: '13'
		},
		{
			value: "方正兰亭圆简体_大,FZLanTingYuanS-EB-GB",
			text: '方正兰亭圆简体_大',
			familyIdx: '14'
		},
		{
			value: "方正兰亭圆简体_细,FZLanTingYuanS-L-GB",
			text: '方正兰亭圆简体_细',
			familyIdx: '15'
		},
		{
			value: "方正新书宋简体,FZNewShuSong-Z10S",
			text: '方正新书宋简体',
			familyIdx: '16'
		},
		{
			value: "方正清刻本悦宋简体,FZQingKeBenYueSongS-R-GB",
			text: '方正清刻本悦宋简体',
			familyIdx: '17'
		},
		{
			value: "方正粗谭黑简体,FZTanHeiS-B-GB",
			text: '方正粗谭黑简体',
			familyIdx: '18'
		},
		{
			value: "方正华隶简体,FZHuaLi-M14S",
			text: '方正华隶简体',
			familyIdx: '19'
		},
		{
			value: "方正尚酷简体,FZShangKuS-R-GB",
			text: '方正尚酷简体',
			familyIdx: '20'
		},
		{
			value: "方正静蕾简体,FZJingLeiS-R-GB",
			text: '方正静蕾简体',
			familyIdx: '21'
		},
		{
			value: "方正喵呜简体,FZMiaoWuS-R-GB",
			text: '方正喵呜简体',
			familyIdx: '22'
		},
		{
			value: "方正粗倩简体,FZCuQian-M17S",
			text: '方正粗倩简体',
			familyIdx: '23'
		},
		{
			value: "方正字迹-吕建德行楷简体,FZZJ-LJDXKJW",
			text: '方正字迹-吕建德行楷简体',
			familyIdx: '24'
		},
		{
			value: "方正剪纸简体,FZJianZhi-M23S",
			text: '方正剪纸简体',
			familyIdx: '25'
		}, 
		{
			value: "方正汉真广标简体,FZHanZhenGuangBiaoS-GB",
			text: '方正汉真广标简体',
			familyIdx: '26'
		},
		{
			value: "Arial",
			text: 'Arial',
			familyIdx: '27'
		},
		{
			value: "Impact",
			text: 'Impact',
			familyIdx: '28'
		},
		{
			value: "Times New Roman",
			text: 'Times New Roman',
			familyIdx: '29'
		}
	];
	import FZCQJW_0_css from '../css/fonts/FZCQJW_0.css';
	import FZCQJW_0 from '../css/fonts/FZCQJW_0.ttf';
	import FZCTHJW_0_css from '../css/fonts/FZCTHJW_0.css';
	import FZCTHJW_0 from '../css/fonts/FZCTHJW_0.ttf';
	import FZHLJW_0_css from '../css/fonts/FZHLJW_0.css';
	import FZHLJW_0 from '../css/fonts/FZHLJW_0.ttf';
	import FZHZGBJW_0_css from '../css/fonts/FZHZGBJW_0.css';
	import FZHZGBJW_0 from '../css/fonts/FZHZGBJW_0.ttf';
	import FZJLJW_0_css from '../css/fonts/FZJLJW_0.css';
	import FZJLJW_0 from '../css/fonts/FZJLJW_0.ttf';

	import FZJZJW_0_css from '../css/fonts/FZJZJW_0.css';
	import FZJZJW_0 from '../css/fonts/FZJZJW_0.ttf';

	import FZLanTYJW_Da_css from '../css/fonts/FZLanTYJW_Da.css';
	import FZLanTYJW_Da from '../css/fonts/FZLanTYJW_Da.ttf';
	import FZLanTYJW_Xi_css from '../css/fonts/FZLanTYJW_Xi.css';
	import FZLanTYJW_Xi from '../css/fonts/FZLanTYJW_Xi.ttf';
	import FZLTTHJW_0_css from '../css/fonts/FZLTTHJW_0.css';
	import FZLTTHJW_0 from '../css/fonts/FZLTTHJW_0.ttf';
	import FZLTXHJW_0_css from '../css/fonts/FZLTXHJW_0.css';
	import FZLTXHJW_0 from '../css/fonts/FZLTXHJW_0.ttf';
	import FZLTZHJW_css from '../css/fonts/FZLTZHJW.css';
	import FZLTZHJW from '../css/fonts/FZLTZHJW.ttf';
	import FZMiaoWuJ_css from '../css/fonts/FZMiaoWuJ.css';
	import FZMiaoWuJ from '../css/fonts/FZMiaoWuJ.ttf';
	import FZQKBYSJW_0_css from '../css/fonts/FZQKBYSJW_0.css';
	import FZQKBYSJW_0 from '../css/fonts/FZQKBYSJW_0.ttf';
	import FZShangKJW_css from '../css/fonts/FZShangKJW.css';
	import FZShangKJW from '../css/fonts/FZShangKJW.ttf';
	import FZXSSJW_0_css from '../css/fonts/FZXSSJW_0.css';
	import FZXSSJW_0 from '../css/fonts/FZXSSJW_0.ttf';
	import FZZDHJW_0_css from '../css/fonts/FZZDHJW_0.css';
	import FZZDHJW_0 from '../css/fonts/FZZDHJW_0.ttf';
	import FZZJ_LJDXKJW_1_css from '../css/fonts/FZZJ-LJDXKJW_1.css';
	import FZZJ_LJDXKJW_1 from '../css/fonts/FZZJ-LJDXKJW_1.ttf';
	import FZZYJW_0_css from '../css/fonts/FZZYJW_0.css';
	import FZZYJW_0 from '../css/fonts/FZZYJW_0.ttf';
	import FZZZHONGJW_0_css from '../css/fonts/FZZZHONGJW_0.css';
	import FZZZHONGJW_0 from '../css/fonts/FZZZHONGJW_0.ttf';
	import FZZZHUNHJW_0_css from '../css/fonts/FZZZHUNHJW_0.css';
	import FZZZHUNHJW_0 from '../css/fonts/FZZZHUNHJW_0.ttf';

	import SIMKAI_css from '../css/fonts/SIMKAI.css';
	import SIMKAI from '../css/fonts/SIMKAI.ttf';
	import SIMYOU_css from '../css/fonts/SIMYOU.css';
	import SIMYOU from '../css/fonts/SIMYOU.ttf';
	import STCAIYUN_css from '../css/fonts/STCAIYUN.css';
	import STCAIYUN from '../css/fonts/STCAIYUN.ttf';
	import STHUPO_css from '../css/fonts/STHUPO.css';
	import STHUPO from '../css/fonts/STHUPO.ttf';
	require('../images/fonts/f1.png');
	require('../images/fonts/f2.png');
	require('../images/fonts/f3.png');
	require('../images/fonts/f4.png');
	require('../images/fonts/f5.png');
	require('../images/fonts/f6.png');
	require('../images/fonts/f7.png');
	require('../images/fonts/f8.png');
	require('../images/fonts/f9.png');
	require('../images/fonts/f10.png');
	require('../images/fonts/f11.png');
	require('../images/fonts/f12.png');
	require('../images/fonts/f13.png');
	require('../images/fonts/f14.png');
	require('../images/fonts/f15.png');
	require('../images/fonts/f16.png');
	require('../images/fonts/f17.png');
	require('../images/fonts/f18.png');
	require('../images/fonts/f19.png');
	require('../images/fonts/f20.png');
	require('../images/fonts/f21.png');
	require('../images/fonts/f22.png');
	require('../images/fonts/f23.png');
	require('../images/fonts/f24.png');
	require('../images/fonts/f25.png');
	require('../images/fonts/f26.png');
	require('../images/fonts/f27.png');
	require('../images/fonts/f28.png');
	require('../images/fonts/f29.png');

	var webFonts =  {
		'方正粗倩简体': FZCQJW_0_css,
		'方正粗谭黑简体': FZCTHJW_0_css,
		'方正华隶简体': FZHLJW_0_css,
		'方正汉真广标简体': FZHZGBJW_0_css,
		'方正静蕾简体': FZJLJW_0_css,
		'方正剪纸简体': FZJZJW_0_css,
		'方正兰亭圆简体_大': FZLanTYJW_Da_css,
		'方正兰亭圆简体_细': FZLanTYJW_Xi_css,
		'方正兰亭特黑简体': FZLTTHJW_0_css,
		'方正兰亭纤黑简体': FZLTXHJW_0_css,
		'方正兰亭中黑简体': FZLTZHJW_css,
		'方正喵呜简体': FZMiaoWuJ_css,
		'方正清刻本悦宋简体': FZQKBYSJW_0_css,
		'方正尚酷简体': FZShangKJW_css,
		'方正新书宋简体': FZXSSJW_0_css,
		'方正正大黑简体': FZZDHJW_0_css,
		'方正字迹-吕建德行楷简体': FZZJ_LJDXKJW_1_css,
		//FZZYJW_0: FZZYJW_0_css,
		'方正正中黑简体': FZZZHONGJW_0_css,
		'方正正准黑简体': FZZZHUNHJW_0_css,
		'楷体': SIMKAI_css,
		'幼圆': SIMYOU_css,
		'华文彩云': STCAIYUN_css,
		'华文琥珀': STHUPO_css, 
	};
	let defaultText = {
		color: "#000000", //字体颜色
		size: 20, //字体大小
		lineHeight: 1,
		family: "微软雅黑,Microsoft YaHei", //字体
		weight: 'normal', //是否加粗
		style: 'normal', //是否斜体
		x: 0,	//X坐标
		y: 0, //Y坐标
		content: '', //文本内容
		//familyIdx:'',
		selected: 0
	};


	import Vue from 'vue';
	import Modal from './Modal.vue';
	import dropDown from './dropDown.vue';
	import loading from '../mixins/loading';
	import '../directives';

	//import fontsUrl from '../css/fonts.less';
	import webFont from 'webfontloader';
	const  editAbleMsg = '当前图片需要审核，不能修改字体样式！';
	let imgLoaded = false;
	const fontTotal = 10;
	const fontEidtBoxExtraVal = 15;
	const defaultContent = '双击输入文案';
	const fontLoadTip = '正在下载字体，请稍等…';
	//需要下载的字体
	const families = ['方正粗倩简体', '方正粗谭黑简体', '方正华隶简体', '方正汉真广标简体', '方正静蕾简体', '方正剪纸简体', '方正兰亭圆简体_大', '方正兰亭圆简体_细', '方正兰亭特黑简体', '方正兰亭纤黑简体', '方正兰亭中黑简体', '方正喵呜简体', '方正清刻本悦宋简体', '方正尚酷简体', '方正新书宋简体', '方正正大黑简体', '方正字迹-吕建德行楷简体', '方正正中黑简体', '方正正准黑简体', '楷体', '幼圆', '华文彩云', '华文琥珀'];

	export default{
		props: [],
		mixins: [loading],
		data(){
			return {
				imgUrl: '',
				imgW: 0,
				imgH: 0,
				listText: [
					
				],
				currentText: Object.assign({}, defaultText),
				currentTextIndex: 0,
				webFontLoadList: [],
				editAble: 0, //0可编辑 1不可编辑
				prevLayerShow: false,
				fontsMaps: fontsMaps,
				showMenu: false
			}
		},
		mounted(){
			/*var arr = [
			{
						color: "#000000",
						content: "华冠超市1",
						family:"方正静蕾简体,FZJingLeiS-R-GB",
						size: 20,
						x: 0,
						y: 0
					},
					{
					color: "#000000",
					content: "华冠超市2",
					family:"华文琥珀,STHupo",
					size: 20,
					x: 145,
					y: 103
				},
				{
					color: "#ff0000",
					content: "华冠超市3",
					family:"方正剪纸简体,FZJianZhi-M23S",
					size: 30,
					x: 230,
					y: 32
				}];
			this.setData(arr);*/
			var options = $(this.$refs.currentFamilySelect.$el).find('.item');
			options.map((i, v) => {
				var img = document.createElement('img');
				img.src = '../images/f' + (i+1) + '.png';
				v.innerText = '';
				v.appendChild(img);
			});
		},
		components:{
			Modal,
			dropDown
		},
		watch: {
		},
		computed: {
			currentFamilyText(){
				for(var i= 0; i < fontsMaps.length; i++ ){
					if(fontsMaps[i].value == this.currentText['family']){
						return fontsMaps[i].text;
					}
				}
				return '请选择';
			}
		},
		methods: {
			imgOnload(){
				console.log('imgloaded');
				imgLoaded = true;
			},
			hidePrevLayer(){
				this.prevLayerShow = false;
			},
			showPrevLayer(){
				if(!imgLoaded){
					alert('图片未加载成功！');
					return;
				}
				this.prevLayerShow = true;
				this.onDraw();
			},
			setImgUrl(url){
				this.imgUrl = url;
			},
			setImgSize(w, h){
				this.imgW = w || 0;
				this.imgH = h || 0;
			},
			setData(data) { //初始化 编辑时使用
				if(typeof data == 'string'){
					data = JSON.parse(data);
				}
				if(!data || !data.length){
					return;
				}
				data.forEach((v, i) => {
					if(v.selected === undefined){
						//兼容没有select的属性的font 防止修改selected属性不生效
						v.selected = 0;
					}
				});
				this.listText = data;
				this.$nextTick(() => {
					this.listText.forEach((item, index) => {
						if(item.selected){
							this.currentTextIndex = index;
						}
						this.onLoadFont(index);
					});
					this.currentText = this.listText[this.currentTextIndex];
				})
				
				
			},
			
			setEditAble(editAble){
				this.editAble = parseInt(editAble) || 0;
			},
			setCurrentFamily(family){
				//$(this.$refs.currentFamilySelect.$el).find('.text')[0].style.fontFamily = family;
				this.currentText.family = family;
				this.onWatch('family');
			},
			getDate() { //获取路径数据
				return this.listText;
			},
			getImageData(){
				var canvas = this.onDraw(true);
				var dataURL = canvas.toDataURL("image/png");
      			return dataURL
			},
			getPsData(){
				if(this.listText.length){
					var list = this.listText;
					list.forEach((v, i) => {
						v.size = parseInt(v.size);
						//兼容老系统
						fontsMaps.forEach((w, j) => {
							if(w.value == v.family){
								v.familyIdx = w.familyIdx
							}
						});
						
					});
					return {
						v: '1.0',
						brower: getBrowserType(),
						font: JSON.stringify(list)
					}
				}else{
					return ''
				}
				
			},
			addText() { //添加文本
				if(this.editAble){
					alert(editAbleMsg);
					return;
				}
				if(this.listText.length + 1 > fontTotal){
					alert(`增加字体不能超过${fontTotal}组`);
					return;
				}
				this.listText.push(Object.assign({}, defaultText, {family: this.currentText.family}));
				this.currentTextIndex = this.listText.length-1;
				this.currentText = this.listText[this.listText.length - 1];
				this.listText.forEach((v, i) => {
					if(i == this.listText.length - 1){
						v.selected = 1;
					}else{
						v.selected =0;
					}
				});
				this.$nextTick(() => {
					this.onBlur({target: $('.edit-input input').eq(this.currentTextIndex)}, this.currentText);
				});
			},
			delText(index){
				if(this.editAble){
					alert(editAbleMsg);
					return;
				}
				this.listText.splice(index, 1);
				this.$nextTick(() => {
					this.listText.forEach((item, index) => {
						this.onBlur({target: $('.edit-input input').eq(index)}, item);
					});
				});
			},
			onActive(item, type) {
				if(this.editAble) {
					alert(editAbleMsg);
					return;
				}
				if(type == 'style'){
					item[type] = (item[type] == 'normal' ? 'italic' : 'normal');
				}
				if(type == 'weight'){
					item[type] = (item[type] == 'normal' ? 'bold' : 'normal');
				}
				this.onWatch(type);
			},
			onSelect(input, index) { //选择文本获取焦点
				this.currentText = input;
				//兼容老系统family只有中文的情况
				this.fontsMaps.forEach((v, i) => {
					if(v.value.indexOf(input.family) >= 0){
						this.currentText.family = v.value;
					}
				});
				this.listText.forEach((v, i) => {
					if(i == index){
						v.selected = 1;
					}else{
						v.selected = 0;
					}
				});

			},
			onInput(event, item) { //双击文本进入编辑
				let $panel = $(event.target);
				if($panel.find("span").length == 0) {
					$panel = $panel.parent();
				}
				$panel.addClass('editing');
				let $span = $panel.find("span"),
					$input = $panel.find("input"),
					$canvas = $panel.find("canvas"),
					$close = $panel.find('.del_icon'),
					oldValue = $input.val(),
					oldW = $panel.width(),
					oldH = $panel.height();


				$close.hide();
				$input.css("width", $panel.width()-2);
				$span.hide();
				//$canvas.hide();
				$input.show();
				$input.focus().select();
				//处理enter /esc
				$input.keyup((e) => {
					var keycode = e.which;
					if(keycode == 13){
						$input.blur();
					}
					if(keycode == 27){
						item.content = oldValue;
						$panel.width(oldW);
						$panel.height(oldH);
						$input.blur();
					}
				})
			},
			onBlur(event, item) { //文本框失去焦点
				let $panel = $(event.target).parent();
				$panel.removeClass('editing');
				if(!$panel.length){
					return;
				}
				let $span = $panel.find("span");
				let $input = $panel.find("input");
				let $canvas = $panel.find("canvas");
				let $close = $panel.find('.del_icon');
				let canvas = $canvas[0];

				$span.show();
				$('.edit-input.active').find('.del_icon').show();
				//如果blur在div外面则隐藏div
				$input.hide();
				$canvas.hide();
				var _canvas = $canvas[0];
				_canvas.height = $panel.height() + fontEidtBoxExtraVal;
				_canvas.width = $panel.width() + 20;//倾斜的文字
				_canvas.style.width = _canvas.getAttribute('width') + 'px';
				_canvas.style.height = _canvas.getAttribute('height') + 'px';
				this.onDrawText(_canvas, item);
				$canvas.show();
				$span.hide();
			},
			onLoadFont(i){
				var item = this.listText[i];
				//判断字体是否加载
				var family = item.family;
				var _family = family.split(',').length ? family.split(',')[0] : family;
				var isWebFont = families.indexOf(_family) >= 0;
				if(!isWebFont){
					let $font = $(this.$el).find(".edit-input").eq(i).find("input");
					this.onBlur({target: $font}, item );
					return;
				}
				var loading;
				webFont.load({
		      		custom: {
		        		families: [_family],
		        		urls : [webFonts[_family]]  //字体声明处，页面不需要引入该样式
		      		},
		      		fontloading: ()=>{
		      			if(!$(this.$el).find('.Loading').length){
							loading = this.openLoading(fontLoadTip, this.$el);
		      			}
		      			
		      		},
					fontactive: (f) => {
						loading && loading.close();
						console.log('success:' + f);

						this.webFontLoadList.push(_family);
						let $font = $(this.$el).find(".edit-input").eq(i).find("input");
						this.onBlur({target: $font}, item );
					},
					fontinactive: (f) => {
						loading && loading.close();
						console.log('fail:' + f);
						alert(f + '字体下载失败，请刷新页面重试！');
						let $font = $(this.$el).find(".edit-input").eq(i).find("input");
						this.onBlur({target: $font}, item );
					},
					timeout: 1*60*1000
		    	});
			},
			onWatch(type) { //修改字体、颜色、大小、加粗、斜体 时触发
				for(var i = 0; i < this.listText.length; i++) {
					if(this.currentText === this.listText[i]) {
						break;
					}
				}
				var item = this.currentText;
				//判断字体是否加载
				var family = item.family;
				var _family = family.split(',').length ? family.split(',')[0] : family;
				var isWebFont = families.indexOf(_family) >= 0;

				if(type == "family" && isWebFont && !this.webFontLoadList.find((webfont) => { if(webfont == _family) return webfont;})) {
					this.onLoadFont(i);
				} else {
					this.$nextTick(() => {
						let $font = $(this.$el).find(".edit-input").eq(i).find("input");
						this.onBlur({target: $font}, item);
					});
					
				}

			},
			greet(val) { //移动文本回写 x y 坐标
				this.currentText.x = val.x;
				this.currentText.y = val.y;
      		},
			onReview(canvas) { //预览生成图片

			},
			checkInputFocus($event){
				var target = $event.target;
				return target.tagName.toUpperCase() == 'INPUT';
			},

			onUp(item, $event) {

				if(this.checkInputFocus($event)){
					return;
				}
				item.y--;
				this.onMove(item);
			},
			onDown(item, $event) {
				if(this.checkInputFocus($event)){
					return;
				}
				item.y++;
				this.onMove(item);
			},
			onLeft(item, $event) {
				if(this.checkInputFocus($event)){
					return;
				}
				item.x--;
				this.onMove(item);
			},
			onRight(item, $event) {
				if(this.checkInputFocus){
					return;
				}
				item.x++;
				this.onMove(item);
			},
			onMove(item) {
				for(var i = 0; i < this.listText.length; i++) {
					if(this.currentText === this.listText[i]) {
						break;
					}
				}
				let $font = $(this.$el).find(".edit-input").eq(i);
				$font.css({top: item.y + 'px', left: item.x + 'px'});
			},
			onDrawText(canvas, item) { //生成文字图片
				let ctx = canvas.getContext("2d");
				//设置字体样式
				ctx.font = `${item.style == 'italic' ? 'italic' : ''} ${item.weight == 'bold' ? 'bold' : ''} ${item.size}px ${item.family}`;
				//设置字体填充颜色
				ctx.fillStyle = item.color;
				ctx.shadowColor = 'rgba(0,0,0,1)';
				ctx.shadowBlur = 2;
				ctx.lineHeight = 3.5;
				ctx.textBaseline = "top";
				//计算文本宽度
				ctx.clearRect(0,0,canvas.width,canvas.height);
				var browerType = getBrowserType();

				var minXY = getTextTop(item.content || defaultContent, item.size, item.family);
				ctx.fillText(item.content || defaultContent, 0 - minXY.x, 0 - minXY.y);

				
				item.img = canvas;
			},
			onDraw(hidePrevCanvas, callBack) { //合并文字绘制图片
				let canvas = document.getElementById('prevImgCanvas');
				if(hidePrevCanvas){
					canvas.style.display = 'none';
				}else{
					canvas.style.display = 'block';
				}
				let ctx = canvas.getContext("2d");
				//ctx.globalAlpha = 8/9;
				let img = new Image();
				img.src = this.imgUrl;
				img.crossOrigin = "Anonymous";
	
		        img.onload = () => {
					canvas.width = img.width;
					canvas.height = img.height;
					ctx.drawImage(img, 0, 0);

					var i = 0;
					this.listText.forEach((item) => {


						item.img && ctx.drawImage(item.img, parseInt(item.x) + 1, parseInt(item.y) + 1);
						
					});
					img.onload = null;
					callBack && callBack(canvas.toDataURL("image/png"));
				};
				//$(this.$el).after(canvas);
				
			}
		}
	}
</script>
<style lang="less">
	@border-color: #d9d9d9;
	.edit-panel {
		min-width: 900px;
		min-height: 200px;
		display: inline-block;
		border: 1px solid @border-color;
		width: 100%;
		.edit-tools {
			width: 100%;
			height: 40px;
			line-height: 40px;
			background-color: #e9e9e9;
			border-bottom: 1px solid @border-color;
			padding-left: 10px;
			box-sizing: border-box;
			input[type='number'] {
				width: 40px;
				height: 20px;
				font-size: 14px;
				
			}
			input[type="text"]{
				width: 66px;
				height: 20px;
				padding: 0 5px;
			}

			input[type='color'] {
				vertical-align: middle;
			}
			
			.green_button{
			    display: inline-block;
			    padding: 3px 10px;
			    color: #fff;
			    border: none;
			    background: #70a25d;
			    &:hover{
			        color: #fff;
			    }
			    &.mini{
			        padding: 3px 20px;
			    }
			    &[disabled="disabled"]{
					opacity: .5;
				}
			}
			.button {
				height: 23px;
				width: 30px;
				text-align: center;
				line-height: 23px;
				color: #fff;
				display: inline-block;
				text-decoration: none !important;
				background-color: #abbac3;
				user-select: none;
				cursor: pointer;
				
				b {
					font-weight: bold;
					font-family: Times New Roman;
				}

				i {
					font-style: italic;
					font-family: Times New Roman;
				}
				

			}

			.button.active, .button[disabled="false"]:hover {
				background-color: #8a9aa3;
			}

			select {
				height: 23px;
			}
		}

		.edit-box {
			width: 100%;
			padding: 5px;

			.edit-image {
				border: 1px dotted #28d0f5;
				display: inline-block;
				overflow: hidden;
				padding: 0px;
				font-size: 0px;
				position: relative;

				.edit-input {
					position: absolute;
					min-width: 10px;
					min-height: 17px;
					top: 0px;
					left: 0px;
					font-size: 0px;
					border: 1px dotted rgba(0, 0, 0, 0);
					cursor: pointer;
					user-select: none;
					white-space: nowrap;
					.del_icon{
						display: none;
						position: absolute;
						width: 14px;
						height: 14px;
						text-align: center;
						line-height: 14px;
						color: #f00;
						font-size: 14px;
						right: 0;
						top: 50%;
						margin-top: -7px;
						display: none;
						z-index: 10;
						&:hover{
							background: rgba(0, 0, 0, .2);
							color: #fff;
							text-decoration: none;
						}
					}
					&.active{
						border: 1px dotted #5cc257;
						.del_icon{
							display: block;
						}
					}
					/*input {
						display: none;
						width: 100%;
						height: 100%;
						text-align: center;
						font-size: inherit;
					}*/
					.edit_input{
						display: none;
						position: absolute;
						left: 0;
						top: 0;
						color: #000;
						font-size: 20px;
						width: 100%;
						height: 30px;
						padding: 0;
					}

					canvas {
						width: 100%;
						height: 100%;
						display: none;
					}
					
				}

				.bold {
					font-weight: bold;
				}

				.italic {
					font-style: italic;
				}
			}
		}

	}
	.prev_box{
		canvas{
			border: 1px dotted #5cc257
		}
	}
	canvas{
		display: inline-block;
	}
	canvas{
		display: inline-block;
	}
	.selection{
		display: inline-block;
		width: 190px;
		vertical-align: middle;
		background: #fff;
		padding: 0;
		line-height: 30px;
		.menu{
			.item{
				height: 30px;
				line-height: 30px;
			}
		} 
	}
	.fontSelect{
		.item{
			img{
				vertical-align: middle;
			}
		}
	}

</style>
