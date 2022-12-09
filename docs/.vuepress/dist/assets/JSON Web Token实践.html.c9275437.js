import{_ as a,z as l,A as t,Y as i,C as e,U as s,a6 as d,Q as r}from"./framework.50abb3c3.js";const u={},o=d(`<h1 id="防抖函数-debounce" tabindex="-1"><a class="header-anchor" href="#防抖函数-debounce" aria-hidden="true">#</a> 防抖函数 debounce</h1><blockquote><p>JSON Web Token 介绍及基于 koa2 实现一个简单的 JWT 鉴权</p></blockquote><p><img src="https://www.wangbase.com/blogimg/asset/201807/bg2018072301.jpg" alt="JWT"></p><h2 id="什么是-jwt" tabindex="-1"><a class="header-anchor" href="#什么是-jwt" aria-hidden="true">#</a> 什么是 JWT</h2><p>全称 JSON Web Token， 是目前最流行的跨域认证解决方案。基本的实现是服务端认证后，生成一个 JSON 对象，发回给用户。用户与服务端通信的时候，都要发回这个 JSON 对象。</p><p>该 JSON 类似如下</p><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>{
  &quot;姓名&quot;: &quot;张三&quot;,
  &quot;角色&quot;: &quot;管理员&quot;,
  &quot;到期时间&quot;: &quot;2018年7月1日0点0分&quot;
}
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="为什么需要-jwt" tabindex="-1"><a class="header-anchor" href="#为什么需要-jwt" aria-hidden="true">#</a> 为什么需要 JWT</h2><p>先看下一般的认证流程，基于 session_id 和 Cookie 实现</p><blockquote><ul><li>1、用户向服务器发送用户名和密码。</li><li>2、服务器验证通过后，在当前对话（session）里面保存相关数据，比如用户角色、登录时间等等。</li><li>3、服务器向用户返回一个 session_id，写入用户的 Cookie。</li><li>4、用户随后的每一次请求，都会通过 Cookie，将 session_id 传回服务器。</li><li>5、服务器收到 session_id，找到前期保存的数据，由此得知用户的身份。</li></ul></blockquote><p>但是这里有一个大的问题，假如是服务器集群，则要求 session 数据共享，每台服务器都能够读取 session。这个实现成本是比较大的。</p><p>而 JWT 转换了思路，将 JSON 数据返回给前端的，前端再次请求时候将数据发送到后端，后端进行验证。也就是服务器是无状态的，所以更加容易拓展。</p><h2 id="jwt-的数据结构" tabindex="-1"><a class="header-anchor" href="#jwt-的数据结构" aria-hidden="true">#</a> JWT 的数据结构</h2><p><img src="https://www.wangbase.com/blogimg/asset/201807/bg2018072303.jpg" alt="JWT数据结构"> JWT 的三个部分依次如下</p><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>- Header(头部)
- Payload(负载)
- Signature(签名)
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>写成一行，就是下面的样子</p><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>Header.Payload.Signature
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><ul><li>Header（头部），类似如下</li></ul><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>{
  &quot;alg&quot;: &quot;HS256&quot;,
  &quot;typ&quot;: &quot;JWT&quot;
}
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>上面代码中，alg 属性表示签名的算法（algorithm），默认是 HMAC SHA256（写成 HS256）；typ 属性表示这个令牌（token）的类型（type），JWT 令牌统一写为 JWT。</p><p>最后，将上面的 JSON 对象使用 Base64URL 算法转成字符串。</p><ul><li>Payload</li></ul><p>Payload 部分也是一个 JSON 对象，用来存放实际需要传递的数据。JWT 规定了 7 个官方字段，供选用。</p><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>iss (issuer)：签发人
exp (expiration time)：过期时间
sub (subject)：主题
aud (audience)：受众
nbf (Not Before)：生效时间
iat (Issued At)：签发时间
jti (JWT ID)：编号

</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>除了官方字段，你还可以在这个部分定义私有字段，下面就是一个例子。</p><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>{
  &quot;sub&quot;: &quot;1234567890&quot;,
  &quot;name&quot;: &quot;John Doe&quot;,
  &quot;admin&quot;: true
}
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>注意，JWT 默认是不加密的，任何人都可以读到，所以不要把秘密信息放在这个部分。</p><p>这个 JSON 对象也要使用 Base64URL 算法转成字符串。</p><ul><li>Signature</li></ul><p>Signature 部分是对前两部分的签名，防止数据篡改。</p><p>首先，需要指定一个密钥（secret）。这个密钥只有服务器才知道，不能泄露给用户。然后，使用 Header 里面指定的签名算法（默认是 HMAC SHA256），按照下面的公式产生签名。</p><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>HMACSHA256(
  base64UrlEncode(header) + &quot;.&quot; +
  base64UrlEncode(payload),
  secret)
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>算出签名以后，把 Header、Payload、Signature 三个部分拼成一个字符串，每个部分之间用&quot;点&quot;（.）分隔，就可以返回给用户。</p><h2 id="jwt-的特点" tabindex="-1"><a class="header-anchor" href="#jwt-的特点" aria-hidden="true">#</a> JWT 的特点</h2><ul><li><p>JWT 默认是不加密，但也是可以加密的。生成原始 Token 以后，可以用密钥再加密一次。</p></li><li><p>JWT 不加密的情况下，不能将秘密数据写入 JWT。</p></li><li><p>JWT 不仅可以用于认证，也可以用于交换信息。有效使用 JWT，可以降低服务器查询数据库的次数。</p></li><li><p>JWT 的最大缺点是，由于服务器不保存 session 状态，因此无法在使用过程中废止某个 token，或者更改 token 的权限。也就是说，一旦 JWT 签发了，在到期之前就会始终有效，除非服务器部署额外的逻辑。</p></li><li><p>JWT 本身包含了认证信息，一旦泄露，任何人都可以获得该令牌的所有权限。为了减少盗用，JWT 的有效期应该设置得比较短。对于一些比较重要的权限，使用时应该再次对用户进行认证。</p></li></ul><p>（6）为了减少盗用，JWT 不应该使用 HTTP 协议明码传输，要使用 HTTPS 协议传输。</p><h2 id="node-简单-demo——-koa-jwt-的实现" tabindex="-1"><a class="header-anchor" href="#node-简单-demo——-koa-jwt-的实现" aria-hidden="true">#</a> Node 简单 demo—— Koa JWT 的实现</h2><h3 id="基本流程" tabindex="-1"><a class="header-anchor" href="#基本流程" aria-hidden="true">#</a> 基本流程</h3><ul><li><p>用户使用用户名密码来请求服务器</p></li><li><p>服务器进行验证用户的信息</p></li><li><p>服务器通过验证发送给用户一个 token</p></li><li><p>客户端存储 token，并在每次请求时附送上这个 token 值</p></li><li><p>服务端验证 token 值，并返回数据</p></li></ul>`,39),c={href:"https://www.npmjs.com/package/jsonwebtoken",target:"_blank",rel:"noopener noreferrer"},v={href:"https://www.npmjs.com/package/koa-jwt",target:"_blank",rel:"noopener noreferrer"},m=d(`<h3 id="生成-token" tabindex="-1"><a class="header-anchor" href="#生成-token" aria-hidden="true">#</a> 生成 Token</h3><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>const crypto = require(&quot;crypto&quot;),
  jwt = require(&quot;jsonwebtoken&quot;);
// TODO:使用数据库
// 这里应该是用数据库存储，这里只是演示用
let userList = [];

class UserController {
  // 用户登录
  static async login(ctx) {
    const data = ctx.request.body;
    if (!data.name || !data.password) {
      return ctx.body = {
        code: &quot;000002&quot;,
        message: &quot;参数不合法&quot;
      }
    }
    const result = userList.find(item =&gt; item.name === data.name &amp;&amp; item.password === crypto.createHash(&#39;md5&#39;).update(data.password).digest(&#39;hex&#39;))
    if (result) {
      const token = jwt.sign(
        {
          name: result.name
        },
        &quot;Gopal_token&quot;, // secret
        { expiresIn: 60 * 60 } // 60 * 60 s
      );
      return ctx.body = {
        code: &quot;0&quot;,
        message: &quot;登录成功&quot;,
        data: {
          token
        }
      };
    } else {
      return ctx.body = {
        code: &quot;000002&quot;,
        message: &quot;用户名或密码错误&quot;
      };
    }
  }
}

module.exports = UserController;
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>通过 jsonwebtoken 的 sign 方法生成一个 token。该方法第一个参数指的是 Payload（负载），用于编码后存储在 token 中的数据，也是校验 token 后可以拿到的数据。第二个是秘钥，服务端特有，注意校验的时候要相同才能解码，而且是保密的，一般而言，最好是定公共的变量，这里只是演示方便，直接写死。第三个参数是 option，可以定义 token 过期时间</p><h3 id="客户端获取-token" tabindex="-1"><a class="header-anchor" href="#客户端获取-token" aria-hidden="true">#</a> 客户端获取 token</h3><p>前端登录获取到 token 后可以存储到 cookie 中也可以存放在 localStorage 中。这里我直接存到了 localStorage 中</p><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>login() {
  this.$axios
    .post(&quot;/api/login&quot;, {
      ...this.ruleForm,
    })
    .then(res =&gt; {
      if (res.code === &quot;0&quot;) {
        this.$message.success(&#39;登录成功&#39;);
        localStorage.setItem(&quot;token&quot;, res.data.token);
        this.$router.push(&quot;/&quot;);
      } else {
        this.$message(res.message);
      }
    });
}

</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="校验-token" tabindex="-1"><a class="header-anchor" href="#校验-token" aria-hidden="true">#</a> 校验 token</h3><p>使用 koa-jwt 中间件进行验证，方式比较简单，如下所示</p><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>// 错误处理
app.use((ctx, next) =&gt; {
  return next().catch((err) =&gt; {
      if(err.status === 401){
          ctx.status = 401;
        ctx.body = &#39;Protected resource, use Authorization header to get access\\n&#39;;
      }else{
          throw err;
      }
  })
})

// 注意：放在路由前面
app.use(koajwt({
  secret: &#39;Gopal_token&#39;
}).unless({ // 配置白名单
  path: [/\\/api\\/register/, /\\/api\\/login/]
}))

// routes
app.use(index.routes(), index.allowedMethods())
app.use(users.routes(), users.allowedMethods())

</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>需要注意的是以下几点：</p><ul><li>secret 必须和 sign 时候保持一致</li><li>可以通过 unless 配置接口白名单，也就是哪些 URL 可以不用经过校验，像登陆/注册都可以不用校验</li><li>校验的中间件需要放在需要校验的路由前面，无法对前面的 URL 进行校验</li></ul>`,11);function b(p,h){const n=r("ExternalLinkIcon");return l(),t("div",null,[o,i("p",null,[e("这里我们用 Node 实现，主要用到的两个库有"),i("a",c,[e("jsonwebtoken"),s(n)]),e("，可以生成 token，校验等，"),i("a",v,[e("koa-jwt"),s(n)]),e(" 中间件 对 jsonwebtoken 进一步的封装，主要用来校验 token")]),m])}const x=a(u,[["render",b],["__file","JSON Web Token实践.html.vue"]]);export{x as default};
