Vue.config.devtools = true;
Vue.prototype.window = window;

const app = new Vue({
    el: '#app',
    data() {
        return {
            model: 'test'
        };
    },
    methods: {
        goPrev() {
            if ('alt' in window) {
                alt.emit('selection:Prev');
            }
        },
        goNext() {
            if ('alt' in window) {
                alt.emit('selection:Next');
            }
        },
        setModel(vehicleModelName) {
            this.model = vehicleModelName;
        },
        selectModel() {
            if ('alt' in window) {
                alt.emit('selection:Select');
            }
        }
    },
    mounted() {
        if ('alt' in window) {
            alt.on('selection:SetModel', this.setModel);
            alt.emit('selection:Ready');
        }
    }
});
