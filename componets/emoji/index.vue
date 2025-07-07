
<template>
	<view class="emoji" :style="{
        'height': height + 'px',
    }">
		<view class="emoji-line" v-for="(line, i ) in emoji" :key="i">
            <view class="emoji-line-item" v-for="(item, index) in line" :key="index" @tap="clickEmoji(item)">{{ item }}</view>
        </view>
	</view>
</template>

<script>
	export default {
        props: {
            height: {
                type: Number,
                default: 200
            }
        },
		data() {
			return {
                emoji: [
                    // 笑脸与情感类
                    ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊"],
                    ["😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "🤩", "🥳"],
                    ["😎", "🤗", "🤭", "🤫", "🤔", "🤐", "🤨", "😐", "😑"],
                    ["😶", "😏", "😒", "🙄", "😬", "🤥", "😳", "🥵", "🥶"],
                    ["😱", "😨", "😰", "😥", "😢", "😭", "😓", "😩", "😫"],
                    ["🥱", "😴", "🤤", "😪", "😵", "😵", "🤯", "🥳", "🐶"],
                    // 动物与自然类
                    [ "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯"],
                    [ "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🐧", "🐦", "🐤"],
                    [ "🐣", "🦆", "🦅", "🦉", "🦇", "🐺", "🐗", "🐴", "🦄"],
                    [ "🐝", "🐛", "🦋", "🐌", "🐞", "🐜", "🦟", "🦗", "🕷️"],
                    [ "🕸️", "🦂", "🐢", "🐍", "🦎", "🦖", "🦕", "🐙", "🦑"],
                    [ "🦐", "🦀", "🐡", "🐠", "🐟", "🐬", "🐳", "🐋", "🍎"],
                ]
            }
		},
        methods: {
            clickEmoji(e) {
                this.$emit('emotion', e)

            }
        }
	}
</script>

<style lang="scss">
    .emoji {
        width: 100%;
        padding: 16rpx 12rpx 120rpx 10rpx;
        box-sizing: border-box;
        overflow-y: hidden;
        overflow: auto;
        .emoji-line {
            display: flex;
            .emoji-line-item {
                flex: 1;
                text-align: center;
                font-size: 52rpx;
                line-height: 80rpx;
            }
        }
    }
</style>
