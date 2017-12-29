import Vue from 'vue';
import editImage from '../../components/editImage.vue';

export default new Vue({
    el: '.page',
    components: {
        editImage
    },
    data(){
        return {
           
        }
    },
    computed: {},
    methods: {
        
    },
    mounted() {
        this.$refs.psTool.setImgUrl('https://s0.meituan.net/bs/file/?f=fe-sso-fs:build/page/static/banner/www.jpg');
        //this.$refs.psTool.setImgSize(data.imgW, data.imgH);
        var fonts = [
            {
                "content": "华冠超市1",
                "family": "方正喵呜简体,FZMiaoWuS-R-GB",
                "familyIdx": "22",
                "style": "normal",
                "weight": "normal",
                "size": 30,
                "color": "#ffffff",
                "x": 306,
                "y":50,
                "selected": 0
            },
            {
                "color": "#000000",
                "size": 20,
                "lineHeight":1,
                "family": "方正静蕾简体,FZJingLeiS-R-GB",
                "weight": "normal",
                "style": "normal",
                "x": 162,
                "y": 52,
                "content": "华冠超市3",
                "selected": 0
            },
            {
                "color": "#ffffff",
                "size": 34,
                "lineHeight": 1,
                "family": "方正兰亭特黑简体,FZLanTingHeiS-H-GB",
                "weight": "normal",
                "style": "normal",
                "x": 100,
                "y": 90,
                "content": "全场满29减10",
                "selected":1
            }
        ];
        this.$refs.psTool.setData(fonts);
        //原图不可编辑
        this.$refs.psTool.setEditAble(0);
    }
});
