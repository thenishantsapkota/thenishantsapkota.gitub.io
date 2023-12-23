hue=$(shuf -i 0-400 -n 1)

sed -i "s/--hue-color: .*/--hue-color: $hue;/" ./assets/css/styles.css