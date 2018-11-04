// pages/address/address.js
import { order } from '../../apis/trade/index';
import { validatePhone } from '../../utils/validate';

const origincity = require('../../utils/city.js');

let city = { ...origincity };
let flag = true;

Page({

  // --------- Data binding --------- //
  data: {
    userName: '',
    phone: null,
    address: '',
    userNameValidated: false,
    addressMenuIsShow: false,
    selectedCity: [0, 0, 0],
    provinces: city.provinces,
    citys: city.citys,
    areas: city.areas,
    animationAddressMenu: {},
    areaInfo: '省-市-区',
    limitList: null,
    isLimited: false,
  },
  // --------- Data binding --------- //


  // --------- Life cycle --------- //
  onLoad(options) {
    city = {
      provinces: [...origincity.provinces],
      citys: { ...origincity.citys },
      areas: { ...origincity.areas },
    };
    flag = true;

    Object.keys(city.citys).forEach((key) => {
      city.citys[key].forEach((its, idx) => {
        if (its.disable) {
          city.citys[key][idx].disable = false;
        }
      });
    });

    this.getAddressData(options);
    // 初始化动画变量
    const animation = wx.createAnimation({
      duration: 500,
      transformOrigin: '50% 50%',
      timingFunction: 'ease',
    });
    this.animation = animation;
    const pCode = this.data.selectedCity[0];
    const cCode = this.data.selectedCity[1];
    const aCode = this.data.selectedCity[2];
    const addressList = [{
      areaCode: aCode,
      provinceCode: pCode,
      cityCode: cCode,
    }];

    let pIndex = 0;
    let cIndex = 0;
    let aIndex = 0;
    let pName = '';
    let cName = '';
    let aName = '';
    let { areaInfo } = this.data;
    const provinceArr = city.provinces;
    if (pCode && provinceArr) {
      provinceArr.forEach((item, index) => {
        if (item.id === pCode) {
          pIndex = index;
          pName = item.name;
        }
      });
    } else {
      pIndex = 0;
      pName = '省';
    }
    const cityArr = pCode ? city.citys[pCode] : city.citys['110000'];
    if (cCode && cityArr) {
      cityArr.forEach((item, index) => {
        if (item.id === cCode) {
          cIndex = index;
          cName = item.name;
        }
      });
    } else {
      cIndex = 0;
      cName = '市';
    }
    const areaArr = cCode ? city.areas[`${cCode}`] : city.areas['110100'];
    if (aCode && areaArr) {
      areaArr.forEach((item, index) => {
        if (item.id === aCode) {
          aIndex = index;
          aName = item.name;
        }
      });
    } else {
      aIndex = 0;
      aName = '区';
    }
    if (!pCode && !cCode && !aCode) {
      areaInfo = '省-市-区';
      this.setData({
        userNameValidated: false,
      });
    } else {
      areaInfo = pName;
      if (cCode) { areaInfo += (`-${cName}`); }
      if ((aCode) && (aName !== '区')) { (areaInfo += (`-${aName}`)); }
    }
    if (areaInfo[areaInfo.length - 1] === '-') {
      areaInfo = areaInfo.slice(0, areaInfo.length - 1);
    }
    this.setData({
      selectedCity: [pIndex, cIndex, aIndex],
      areaInfo,
      citys: cityArr,
      areas: areaArr,
      addressList,
    });
    this.getOrder();
  },
  // --------- Life cycle --------- //


  // --------- Controller Methods --------- //
  // 获取限制发货区域数据
  getOrder() {
    const bizOrderId = { bizOrderId: this.data.bizOrderId };
    const that = this;
    order.queryOrderDetail(bizOrderId).then((res) => {
      const idList = [];
      const { wxhcBizOrderExhiDTOList } = res.entry;
      wxhcBizOrderExhiDTOList.forEach((element) => {
        element.packageList.forEach((item) => {
          item.subBizOrderList.forEach((it) => {
            idList.push(it.itemId);
          });
        });
      });
      // console.log(idList);
      const params = {
        itemIdList: idList,
        subBizType: 302,
      };
      order.queryByItems(params).then((resp) => {
        const list = [];
        const addressList = this.data.addressList[0];
        resp.entry.forEach((item) => {
          item.attributes.addressAttributes.forEach((it) => {
            list.push(it);
          });
        });
        console.log(list);
        // 查看回填地址是否ok
        list.forEach((item) => {
          if (addressList.provinceCode === item.provinceCode.toString()) {
            if (item.cityCode === addressList.cityCode || !item.cityCode) {
              that.setData({ isLimited: true });
            }
          }
        });
        this.setData({
          limitList: list,
        });
      });
    });
  },
  // --------- Controller Methods --------- //


  // --------- Personal Methods --------- //
  getAddressData(option) {
    option = unescape(option.params);
    const options = {};
    option.split('&').forEach((item) => {
      const value = item.split('=');
      const [key, val] = value;
      options[key] = val;
    });
    const selectedCity = options.selectedCity ? options.selectedCity.split(',') : [0, 0, 0];
    this.setData({
      userName: options.name || '', phone: options.phone || '', address: options.address || '', bizOrderId: options.bizOrderId || '', userNameValidated: true, selectedCity: selectedCity || '',
    });
  },
  // --------- Personal Methods --------- //


  // --------- Dom Events --------- //

  // 手机号输入时验证
  phoneInput(event) {
    const phone = event.detail.value;
    let { userNameValidated } = this.data;
    if (phone.length === 11 && this.data.userName && this.data.address) {
      userNameValidated = true;
    } else {
      userNameValidated = false;
    }
    this.setData({ userNameValidated, phone });
  },
  // 用户输入地址
  addressInput(event) {
    const address = event.detail.value;
    let { userNameValidated } = this.data.userNameValidated;
    if (address && this.data.userName && this.data.phone && this.data.phone.length === 11) {
      userNameValidated = true;
    } else {
      userNameValidated = false;
    }
    this.setData({ address, userNameValidated });
  },
  // 用户信息输入
  userNameIn(event) {
    const userName = event.detail.value;
    let { userNameValidated } = this.data.userNameValidated;
    if (userName && this.data.address && this.data.phone && this.data.phone.length === 11) {
      userNameValidated = true;
    } else {
      userNameValidated = false;
    }
    this.setData({ userName, userNameValidated });
  },
  // 点击选择地区弹出选择框
  selectDistrict() {
    const that = this;
    // 如果已经显示，不在执行显示动画
    if (that.data.addressMenuIsShow) {
      return;
    }
    // 执行显示动画
    that.startAddressAnimation(true);
  },
  // 执行动画
  startAddressAnimation(isShow) {
    const that = this;
    if (isShow) {
      that.animation.translateY(0).step();
    } else {
      that.animation.translateY(434).step();
    }
    that.setData({
      animationAddressMenu: that.animation.export(),
      addressMenuIsShow: isShow,
    });
  },
  // 显示
  showMenuTap() {
    const list = this.data.limitList;
    const pros = this.data.provinces;

    if (list) {
      console.log('list');
      list.forEach((item) => {
        if (item.regionalLevel === 1) {
          pros.forEach((it, idx) => {
            if (it.id === item.provinceCode.toString()) {
              pros[idx].disable = true;
              city.citys[pros[idx].id] = [{ name: '该区域不发货', id: -1, disable: true }];
              // console.log(1,city.citys[pros[idx].id])
            }
          });
        } else if (item.regionalLevel === 2) {
          Object.keys(city.citys).forEach((key) => {
            city.citys[key].forEach((its, idx) => {
              if (its.id === item.cityCode.toString()) {
                city.citys[key][idx].disable = true;
                city.areas[city.citys[key][idx].id] = [{ name: '该区域不发货', id: -1, disable: true }];
              }
            });
          });
        }
      });
      console.log('筛选完毕', city.citys);
    }
    // console.log(city.citys[this.data.addressList[0].provinceCode]);
    if (flag) {
      this.setData({
        provinces: pros,
        citys: city.citys[this.data.addressList[0].provinceCode],
        areas: city.citys[this.data.addressList[0].provinceCode] && city.citys[this.data.addressList[0].provinceCode][0].id === -1 ? null : city.areas[this.data.addressList[0].cityCode],
      });
      flag = false;
    }
    // 如果当前已经显示，再次点击时隐藏
    if (this.data.isVisible === true) {
      this.startAddressAnimation(false);
      return;
    }
    this.startAddressAnimation(true);
  },
  // 隐藏选择器
  hideCitySelected() {
    this.startAddressAnimation(false);
  },
  // 点击取消按钮
  cityCancel() {
    this.startAddressAnimation(false);
  },
  // 点击确定按钮
  citySure() {
    const that = this;
    const value = that.data.selectedCity;
    if (this.data.pf || this.data.cf || this.data.provinces[value[0]].disable || (this.data.citys[value[1]].disable && this.data.citys[value[1]])) {
      wx.showToast({
        title: '该区域不发货',
        icon: 'none',
        duration: 1500,
      });
      return;
    }
    that.startAddressAnimation(false);
    // 将选择的城市信息显示到输入框
    const pName = (that.data.provinces[value[0]] && that.data.provinces[value[0]].name) || '';
    const cName = (that.data.citys[value[1]] && that.data.citys[value[1]].name) || '';
    const aName = (that.data.areas[value[2]] && that.data.areas[value[2]].name) || '';
    let areaInfo = `${pName}-${cName}-${aName}`;
    if (areaInfo[areaInfo.length - 1] === '-') {
      areaInfo = areaInfo.slice(0, areaInfo.length - 1);
    }
    that.setData({
      areaInfo,
    });
    this.setData({ isLimited: false });
  },
  // 处理省市区联动逻辑
  cityChange(e) {
    const { value } = e.detail;
    const { provinces, citys } = this.data;
    const provinceNum = value[0];
    const cityNum = value[1];
    const countyNum = value[2];

    this.setData({ noAddress: true });
    // console.log(value);
    if (this.data.selectedCity[0] !== provinceNum || (this.data.selectedCity[0] === provinceNum && this.data.pf)) {
      const { id } = provinces[provinceNum];
      if (provinces[provinceNum].disable) {
        // console.log('woannsadnsadnaskd');
        this.setData({
          citys: city.citys[id],
          areas: city.areas[city.citys[id][0].id] || [],
          pf: true,
        });
      } else {
        this.setData({
          selectedCity: [provinceNum, 0, 0],
          citys: city.citys[id],
          areas: city.areas[city.citys[id][0].id] || [],
          pf: false,
        });
      }
    } else if (this.data.selectedCity[1] !== cityNum || (this.data.selectedCity[1] === cityNum && this.data.cf)) {
      if (citys[cityNum].disable) {
        this.setData({
          areas: city.areas[citys[cityNum].id] || [],
          cf: true,
        });
      } else {
        this.setData({
          selectedCity: [provinceNum, cityNum, 0],
          areas: city.areas[citys[cityNum].id] || [],
          cf: false,
        });
      }
    } else {
      this.setData({
        selectedCity: [provinceNum, cityNum, countyNum],
      });
    }
  },
  // 点击保存按钮
  submitFn() {
    if (this.data.isLimited) {
      wx.showToast({
        title: '该区域暂不支持发货',
        icon: 'none',
        duration: 1500,
      });
      return;
    }
    if (this.data.userName && this.data.phone) {
      const that = this;
      if (!validatePhone(this.data.phone)) {
        wx.showToast({
          title: '手机号输入错误',
          image: 'none',
        });
      } else {
        if (!this.data.userNameValidated) {
          return;
        } else if (this.data.areaInfo === '省-市-区' || this.data.areaInfo === '省-市') {
          wx.showToast({
            title: '请填写详细地区',
            icon: 'none',
          });
          return;
        }
        const { selectedCity } = this.data;
        const data = {
          bizOrderId: this.data.bizOrderId,
          mobileNumber: this.data.phone,
          receiverName: this.data.userName,
          partAddress: this.data.address,
          // remarks: this.data.remarks,
          provinceCode: (this.data.provinces[selectedCity[0]] && this.data.provinces[selectedCity[0]].id) || '',
          cityCode: (city.citys[that.data.provinces[selectedCity[0]].id][selectedCity[1]] && city.citys[that.data.provinces[selectedCity[0]].id][selectedCity[1]].id) || '',
          areaCode: (that.data.areas && selectedCity[2] !== undefined && city.areas[city.citys[that.data.provinces[selectedCity[0]].id][selectedCity[1]].id] && city.areas[city.citys[that.data.provinces[selectedCity[0]].id][selectedCity[1]].id][selectedCity[2]] && city.areas[city.citys[that.data.provinces[selectedCity[0]].id][selectedCity[1]].id][selectedCity[2]].id) || '',
        };
        order.updateOrderAddress(data).then((res) => {
          if (res.status) {
            wx.showToast({
              title: '保存成功',
            });
            setTimeout(() => {
              wx.hideToast();
              wx.navigateBack({
                delta: 1,
              });
            }, 1200);
          } else {
            wx.showToast({
              image: 'none',
              title: '保存失败',
            });
            setTimeout(() => {
              wx.hideToast();
            }, 1200);
          }
        });
      }
    }
  },

  // --------- Dom Events --------- //
});
