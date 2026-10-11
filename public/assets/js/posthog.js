!function(t,e){var o,n,p,r;e.__SV||(window.posthog&&window.posthog.__loaded)||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}p=t.createElement("script"),p.type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",p.onerror=function(){p=null},r=t.getElementsByTagName("script")[0],r.parentNode.insertBefore(p,r);var u=e;void 0!==a?u=e[a]=[]:a="posthog";u.people=u.people||[];for(o="init capture register register_once register_for_session unregister unregister_for_session identify setPersonProperties setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroups reset alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException get_distinct_id getGroups get_session_id get_session_replay_url opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
    posthog.init("phc_oPDhK3y5PEkFbCHFEBhHoiu4PhqfKdMUVAK6n6Z6UWTc", {
      api_host: "https://eu.i.posthog.com",
      defaults: "2026-05-30",
      capture_pageview: true,
      autocapture: false,
      disable_session_recording: true,
      respect_dnt: true
    });
