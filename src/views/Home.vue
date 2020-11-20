<template>
    <div>
        <div id="top-wrap">
            <el-row>
                <div class="filter-wrap">
                    <span class="text">起讫日期：</span>
                    <el-date-picker
                            size="mini"
                            value-format="yyyy/MM/dd"
                            v-model="duration"
                            type="daterange"
                            range-separator="至"
                            start-placeholder="开始日期"
                            end-placeholder="结束日期">
                    </el-date-picker>
                </div>
                <div class="filter-wrap" style="width: 300px;">
                    <span class="text">员工姓名：</span>
                    <el-input
                            @keyup.native.enter="showEmployeeSearch()"
                            size="mini"
                            placeholder="员工姓名"
                            v-model.trim="employee_name"
                            clearable>
                        <el-button slot="append" icon="el-icon-search"
                                   @click="showEmployeeSearch()">
                        </el-button>
                    </el-input>
                </div>
            </el-row>
            <el-row class="btns">
                <el-button icon="el-icon-search" plain type="primary" size="small" @click="onRefresh()">刷新</el-button>
                <el-button icon="el-icon-download" plain size="small" @click="onExport()">导出</el-button>
                <el-button icon="el-icon-back" plain size="small" v-show="!isShow" @click="onBack()">返回</el-button>
                <el-button icon="el-icon-edit" plain size="small" type="success" @click="onOpenRate()">当前利率：<b>{{ rate
                    }}</b></el-button>
            </el-row>
        </div>
        <div id="mainTable" v-show="isShow">
            <el-table
                    stripe
                    @row-dblclick="rowDblClick"
                    :data="tableData"
                    :height="height"
                    border
                    show-summary
                    :summary-method="getSummaries"
                    style="width: 100%">
                <el-table-column
                        type="index"
                        header-align="center"
                        label="序号"
                        align="center"
                        width="100">
                </el-table-column>
                <el-table-column
                        prop="employee_id"
                        label="员工ID"
                        header-align="center"
                        align="center"
                        width="200">
                </el-table-column>
                <el-table-column
                        prop="employee_name"
                        label="员工姓名"
                        header-align="center"
                        align="center"
                        width="200">
                </el-table-column>
                <el-table-column
                        sortable
                        fixed="right"
                        prop="overdue_fee"
                        header-align="center"
                        align="right"
                        label="滞纳金">
                    <template slot-scope="scope">
                        {{ scope.row.overdue_fee | roundUp }}
                    </template>
                </el-table-column>
            </el-table>
            <span>共{{ total }}条记录</span>
        </div>

        <!--        明细表-->
        <div id="detailTable" v-show="!isShow">
            <el-table
                    stripe
                    :data="detailTableData"
                    :height="height"
                    border
                    style="width: 100%">
                <el-table-column
                        type="index"
                        label="序号"
                        align="center"
                        header-align="center"
                        width="100">
                </el-table-column>
                <el-table-column
                        prop="employee_name"
                        label="员工名称"
                        header-align="center"
                        align="center"
                        width="200">
                </el-table-column>
                <el-table-column
                        prop="over_due"
                        sortable
                        label="超期金额"
                        header-align="center"
                        align="right"
                        width="250">
                    <template slot-scope="scope">
                        {{ scope.row.over_due | roundUp }}
                    </template>
                </el-table-column>
                <el-table-column
                        prop="rate"
                        label="利率"
                        sortable
                        header-align="center"
                        align="right"
                        width="250">
                </el-table-column>
                <el-table-column
                        sortable
                        prop="overdue_fee"
                        header-align="center"
                        align="right"
                        label="滞纳金">
                    <template slot-scope="scope">
                        {{ scope.row.overdue_fee | roundUp }}
                    </template>
                </el-table-column>
                <el-table-column
                        prop="created_at"
                        label="创建日期"
                        align="center"
                        header-align="center">
                    <template slot-scope="scope">
                        {{ scope.row.created_at | formatDate }}
                    </template>
                </el-table-column>
            </el-table>
            <el-pagination
                    background
                    @current-change="pageChange"
                    :current-page.sync="currentPage"
                    :page-size="limit"
                    layout="total, prev, pager, next"
                    :total="record">
            </el-pagination>
        </div>
        <!--        员工页面-->
        <el-dialog title="员工查询" :visible.sync="isShowEmployeeSearch">
            <el-row>
                <div class="filter-wrap">
                    <el-input
                            @keyup.native.enter="showEmployeeSearch()"
                            size="mini"
                            placeholder="员工姓名"
                            v-model.trim="employee_name"
                            clearable>
                        <el-button slot="append" icon="el-icon-search"
                                   @click="showEmployeeSearch()">
                        </el-button>
                    </el-input>
                </div>
            </el-row>
            <el-table
                    stripe
                    width="100%"
                    max-height="350"
                    :data="employeeData"
                    @row-click="ErowClick">
                <el-table-column property="id" label="ID"></el-table-column>
                <el-table-column property="name" label="姓名"></el-table-column>
            </el-table>
            <span>共{{ ETotal }}条</span>
            <el-pagination
                    @current-change="EpageChange"
                    :current-page.sync="EcurrentPage"
                    layout="prev, pager, next"
            >
            </el-pagination>
        </el-dialog>
        <!--        员工页面 over-->
    </div>

</template>

<script>

    export default {
        name: "Home",
        data() {
            return {
                tableData: [],
                detailTableData: [],
                total: 0, //第一次总数
                isShow: true, // 在第一层
                record: 0, // 第二层总数
                limit: 50, // 明细层的limit
                duration: [], // 时间数组
                employee_id: '',
                employee_name: '',
                rowClicked: {}, // 第一层双击的行
                isShowEmployeeSearch: false,
                employeeData: [],
                cache_employee: [], // 缓存员工转化成数组
                EcurrentPage: 1, // 员工页码
                currentPage: 1, //第二层页码
                Elimit: 20, // 员工查找的limit
                ETotal: 0, // 员工查找的数量
                height: 450,
                rate: 0, // 利率
                set_of_book: '',
                set_of_book_id: ''
            }
        },
        filters: {
            roundUp(value, precision = 2) { // 四舍五入 默认保留2位
                if ( value == null ) {
                    return '-'
                }
                value = Number(value)
                if ( value == 0 ) {
                    return 0
                }
                let tmp = Math.pow(10, precision)
                return ( Math.round(value * tmp) / tmp ).toFixed(precision)
            },
            formatDate(value) { // 只保留年月日
                let arr = value.split(' ')
                return arr[0]
            }
        },
        watch: {
            employee_name: {
                handler(n, o) {
                    if ( n == '' ) {
                        this.employee_id = ''
                    }
                },
                immediate: true
            },
            duration: {
                handler(n, o) {
                    if ( !n ) {
                        this.duration = []
                    }
                },
                immediate: true
            }
        },
        mounted() {
            this.init()
            this.getECache()
            this.$nextTick(function () { // 表格高度
                this.height = document.documentElement.clientHeight - 150
            })
            this.getRate()
        },
        methods: {
            init() {
                this.getInitTime()
                let params = {
                    start_date: this.duration[0],
                    end_date: this.duration[1]
                }
                this.getOverDue(params)
            },
            getSummaries(param) {
                const { columns, data } = param;
                const sums = [];
                columns.forEach((column, index) => {
                    if ( index === 0 ) {
                        sums[index] = '总计';
                        return;
                    }
                    if ( index === 1 || index === 2 ) { // employee_id&name
                        sums[index] = '';
                    }
                    else {
                        const values = data.map(item => Number(item[column.property]));
                        if ( !values.every(value => isNaN(value)) ) {
                            sums[index] = values.reduce((prev, curr) => {
                                const value = Number(curr);
                                if ( !isNaN(value) ) {
                                    return prev + curr;
                                }
                                else {
                                    return prev;
                                }
                            }, 0);
                            sums[index] = this.$options.filters.roundUp(sums[index])
                            sums[index] += ' 元';
                        }
                    }

                });

                return sums;
            },
            onOpenRate() {
                this.$prompt(`请输入`, '更新利率', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消'
                }).then(({ value }) => {
                    this.putRate(value)
                }).catch(() => {
                    this.$message({
                        type: 'info',
                        message: '取消变更'
                    });
                })
            },
            putRate(rate) {
                this.$axios({
                    url: `/api/set_of_books/${ this.set_of_book_id }`,
                    method: 'PUT',
                    params: {
                        rate: Number(rate.replace(/(^\s*)|(\s*$)/g, ''))
                    }
                }).then(res => {
                    if ( res.state == 1 ) {
                        this.rate = res.rate
                        this.$message({
                            type: 'success',
                            message: '利率修改成功'
                        })
                        return
                    }
                    alert(res.errmsg)
                }).catch(err => {
                    alert('更新失败', err)
                })
            },
            getRate() {
                this.set_of_book = this.$root.$data.infoData.user.set_of_book
                this.$axios({
                    url: `/api/set_of_books`,
                    params: {
                        set_of_book: this.set_of_book
                    }
                }).then(res => {
                    if ( res.state == 1 ) {
                        this.set_of_book_id = res.id
                        this.rate = res.rate
                        return
                    }
                    alert(res.errmsg)
                }).catch(err => {
                    alert('获取利率失败', err)
                })
            },
            getECache() { // employee cache
                let Edata = this.$root.$data.infoData.cache.employee
                for ( let i in Edata ) {
                    this.cache_employee.push(Edata[i])
                }
            },
            getInitTime() {
                let time = []
                var date = new Date()
                var year = date.getFullYear()
                var month = date.getMonth() + 1
                var today = date.getDate()
                time[0] = `${ year }/${ month }/1`
                time[1] = `${ year }/${ month }/${ today }`
                this.duration = time
            },
            ErowClick(row) {
                this.employee_id = row.id
                this.employee_name = row.name
                this.isShowEmployeeSearch = false
            },
            EpageChange(idx) {
                this.employeeData = this.cache_employee.slice(this.Elimit * ( idx - 1 ), this.Elimit * idx)
            },
            showEmployeeSearch() {
                this.EcurrentPage = 1
                this.isShowEmployeeSearch = true
                this.cache_employee = []
                if ( this.employee_name ) {
                    let Edata = this.$root.$data.infoData.cache.employee
                    for ( let i in Edata ) {
                        if ( Edata[i].name && Edata[i].name.indexOf(this.employee_name) > -1 ) {
                            this.cache_employee.push(Edata[i])
                        }
                    }

                    this.ETotal = this.cache_employee.length
                    this.employeeData = this.cache_employee.slice(0, this.Elimit)
                }else {
                    this.getECache()
                    this.ETotal = this.cache_employee.length
                    this.employeeData = this.cache_employee.slice(0, this.Elimit)
                }
            },
            exportExcel(url, params, name) {
                this.$axios({
                    url: url,
                    method: 'get',
                    responseType: 'blob',
                    params
                }).then(res => { // res已经是Blob
                    const link = document.createElement('a')
                    link.style.display = 'none'
                    link.href = URL.createObjectURL(res)
                    link.setAttribute('download', `${ name }.xlsx`)
                    document.body.appendChild(link)
                    link.click()
                    document.body.removeChild(link)
                })
            },
            onExport() {
                if ( this.isShow ) { // 第一层
                    let params = {
                        start_date: this.duration[0],
                        end_date: this.duration[1],
                        employee_id: this.employee_id,
                        format: 'excel'
                    }
                    let url = `/api/overdue_reports?action=overdue`
                    this.exportExcel(url, params, '滞纳金报表')
                }
                else {
                    let params = {
                        start_date: this.duration[0],
                        end_date: this.duration[1],
                        employee_id: this.employee_id || this.rowClicked.employee_id,
                        start: 0,
                        limit: this.limit,
                        format: 'excel'
                    }
                    let url = `/api/overdue_reports?action=overdue_line`
                    this.exportExcel(url, params, '滞纳金报表明细')
                }
            },
            onRefresh() {
                if ( this.isShow ) { // 第一层
                    let params = {
                        start_date: this.duration[0],
                        end_date: this.duration[1],
                        employee_id: this.employee_id
                    }
                    this.getOverDue(params)
                }
                else {
                    let params = {
                        start_date: this.duration[0],
                        end_date: this.duration[1],
                        employee_id: this.employee_id || this.rowClicked.employee_id,
                        start: 0,
                        limit: this.limit
                    }
                    this.getDetail(params)
                }
            },
            onBack() { // 第一层和第二层切换
                this.isShow = !this.isShow
                this.currentPage = 1
            },
            getOverDue(params) {
                this.$axios({
                    url: `/api/overdue_reports?action=overdue`,
                    method: 'GET',
                    params: params
                }).then(res => {
                    if ( res.state == 1 ) {
                        this.tableData = res.root
                        this.total = res.total
                        return
                    }
                    alert(res.errmsg)
                }).catch(err => {
                    alert('获取主表失败', err)
                })
            },
            rowDblClick(row) {
                this.isShow = !this.isShow
                this.rowClicked = row
                this.getDetail(null, row)
            },
            getDetail(params = '', row, start = 0) {
                let employee_id = row ? row.employee_id : this.rowClicked.employee_id
                params = params || {
                    start_date: this.duration[0],
                    end_date: this.duration[1],
                    employee_id: employee_id,
                    start: start,
                    limit: this.limit
                }
                this.$axios({
                    url: `/api/overdue_reports?action=overdue_line`,
                    params: params
                }).then(res => {
                    if ( res.state == 1 ) {
                        this.detailTableData = res.root
                        this.record = res.total
                        return
                    }
                    alert(res.errmsg)
                }).catch(err => {
                    alert('获取明细失败', err)
                })
            },
            pageChange(idx) {
                this.getDetail(null, null, this.limit * ( idx - 1 ))
            }
        }
    };
</script>
<style lang="less" scoped>
    #mainTable, #detailTable {
        padding: 0 20px;
    }

    #top-wrap {
        height: 100px;
        overflow: hidden;

        .filter-wrap {
            width: 431px;
            float: left;

            .el-input {
                width: 50%;
            }

            .text {
                display: inline-block;
            }
        }
        .btns {
            margin-top: 10px;
            display: flex;
            justify-content: flex-start;

            .rate {
                display: inline-block;
                margin-left: 10px;
            }
        }
    }

</style>
