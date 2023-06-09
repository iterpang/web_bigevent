$(function() {
  var layer = layui.layer
  var form = layui.form
  var laypage = layui.laypage


  // 定义美化时间的过滤器
  template.defaults.imports.dataFormat = function (data) {
    const dt = new Date(data)
    var y = dt.getFullYear();
    var m = padZero(dt.getMonth() + 1);
    var d = padZero(dt.getDate());

    var hh = padZero(dt.getHours());
    var mm = padZero(dt.getMinutes());
    var ss = padZero(dt.getSeconds());
    return y + "-" + m + "-" + d + ' ' + hh + ':' + mm + ':' + ss;
  }

  // 定义补零的函数
  function padZero(n) {
    return n > 9 ? n : '0' + n
  }

  // 定义一个查询的参数对象，将来请求数据的时候，需要将请求参数对象提交到服务器
  var q = {
    pagenum: 1, // 页码值，默认请求第一页的数据
    pagesize: 2, // 每页显示几条数据，默认每页显示2条
    cate_id: '', //文章分类的Id
    state:'', // 文章的发布状态
  }
  initTable()
  initCate()

  // 获取文章数据列表的数据
  function initTable() {
    $.ajax({
      method: 'GET',
      url: '/my/article/list',
      data: q,
      success: function(res) {
        if (res.status !== 0) {
          return layer.msg('获取文章列表失败！')
        }
        // 使用模板引擎渲染页面的数据
        var htmlStr = template('tpl-table', res)
        $('tbody').html(htmlStr)
        // 调用渲染分页的方法
        renderPage(res.total)
      }
    })
  }


  // 初始化文章分类的方法
  function initCate(){
    $.ajax({
      method: 'GET',
      url: '/my/article/cates',
      success: function(res) {
        if (res.status !== 0 ) {
          return layer.msg('获取分类数据失败！')
        }
        // 调用模板引擎渲染分类的可选项
        var htmlStr = template('tpl-cate', res)
        $('[name=cate_id]').html(htmlStr)
        // 通知 layui 重新渲染表单区域的ui结构
        form.render()
      }
    })
  }

  // 为筛选表单绑定 submit 事件
  $('#form-search').on('submit', function(e) {
    e.preventDefault()
    // 获取表单选项中的值
    var cate_id = $('[name=cate_id]').val()
    var state = $('[name=state]').val()
    // 为查询参数对象q中的对应属性赋值
    q.cate_id = cate_id
    q.state = state
    // 根据最新的筛选条件，重新渲染表格的数据
    initTable()
  })

  // 定义渲染分页的方法
  function renderPage(total) {
    // 调用laypage.render()方法渲染分页的结构
    laypage.render({
      elem: 'pageBox', // 分页的容器 Id
      count: total, // 总数据条数
      limit: q.pagesize, // 每页显示几条数据
      curr: q.pagenum, // 默认选中哪一页
      layout: ['count','limit','prev','page','next','skip'],
      limits: [2,3,5,10],
      // 分页发生切换时，触发jump回调函数
      // 触发jump回调函数的方式有两种：1.点击页码(first=undefined)  2.只要调用了laypage.render()方法，就会触发jump回调(first=true)
      // 可以通过first的值判断是通过哪一种方式触发的jump回调
      jump: function(obj,first) {
        q.pagenum = obj.curr //把最新的页码值，赋值给q这个查询参数中
        q.pagesize = obj.limit //把最新的条目数，赋值给q这个查询参数中
        // initTable()  // 根据最新的q获取对应的数据列表，并渲染表格
        if (!first) { // 
          initTable()
        }
      }
    })
  }

  // 通过代理的形式为btn-edit按钮绑定点击事件
  $('tbody').on('click', '.btn-edit', function(e) {
    $('.art-list').hide()
    $('#art-edit').show()
    initEditor()
    // 1. 初始化图片裁剪器
    var $image = $('#image')
    // 2. 裁剪选项
    var options = {
    aspectRatio: 400 / 280,
    preview: '.img-preview'
    }
    // 3. 初始化裁剪区域
    $image.cropper(options)

    // var id = $(this).attr('data-id') 
    // // 发起请求获取对应分类的数据，自动填充表单
    //  $.ajax({
    //   method: 'GET',
    //   url: '/my/article/' + id,
    //   success: function(res) {
    //     form.val('form-edit', res.data)
    //   }
    // })
  })






  // 通过代理的形式，为删除按钮绑定点击事件处理函数
  $('tbody').on('click', '.btn-delete', function() {
    // 获取删除按钮的数量
    var len = $('.btn-delete').length
    // 获取到文章的Id
    var id = $(this).attr('data-id')
    // 询问用户是否要删除
    layer.confirm('确认删除?', {icon: 3, title:'提示'}, function(index){
      $.ajax({
        method: 'GET',
        url: '/my/article/delete/' + id,
        success: function(res) {
          if (res.status !== 0) {
            return layer.msg('删除文章失败！')
          }
          layer.msg('删除文章成功！')
          // 当数据删除完成后，需要判断当前这一页中，是否还有剩余的数据，如果没有剩余的数据了，则让页码值-1后，重新调用initTable方法
          if (len === 1) {
            // 如果len的值等于1，则证明删除完毕之后，此页面上没有任何数据了
            // 页码值最小值必须是1
            q.pagenum = q.pagenum === 1 ? 1: q.pagenum - 1
          }
          initTable()
        }
      })
      layer.close(index);
    });
  })
  
})
