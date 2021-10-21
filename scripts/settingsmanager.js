//0 - device
//1 - train
//2 - both

const changeTZ = (() => {
	let list = document.getElementById('tz');
	localStorage.setItem('settings_tz', list.selectedIndex)
})

let list = document.getElementById('tz');
list.selectedIndex = localStorage.getItem('settings_tz')