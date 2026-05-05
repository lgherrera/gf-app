// app/terms/page.tsx
"use client";

import styles from "./terms.module.css";

const isNSFW = process.env.NEXT_PUBLIC_APP_SOURCE === "nsfw";
const BRAND_COLOR = isNSFW ? "#e60049" : "#348cd4";

export default function TermsPage() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <header className={styles.header}>
          <a href="/" className={styles.backLink} style={{ color: BRAND_COLOR }}>
            ← Volver
          </a>
          <h1 className={styles.title}>
            Términos y Condiciones del Servicio
          </h1>
          <div className={styles.accent} style={{ background: BRAND_COLOR }} />
          <p className={styles.subtitle}>
            ¡Bienvenido/a a Polola.AI!
          </p>
        </header>

        <div className={styles.intro}>
          <p>
            Estos Términos y Condiciones (los &quot;T&C&quot;) establecen los términos
            legalmente vinculantes para el uso del servicio de compañía virtual con
            inteligencia artificial Polola.AI (en adelante, el &quot;Servicio&quot;),
            incluyendo todos los contenidos, plataformas, canales y productos asociados.
          </p>
          <p>
            Al acceder y/o utilizar el Servicio, usted acepta quedar sujeto a estos T&C.
            Si no está de acuerdo con alguna de sus disposiciones, debe dejar de utilizar
            el Servicio de inmediato.
          </p>
        </div>

        <div className={styles.keyPoints}>
          <h3 className={styles.keyPointsTitle} style={{ color: BRAND_COLOR }}>
            Aspectos clave a tener en cuenta:
          </h3>
          <ul className={styles.keyPointsList}>
            <li>
              El Servicio es exclusivamente para fines de <strong>entretenimiento</strong>.
              No está destinado a brindar apoyo emocional, psicológico ni de ningún otro tipo.
              Si experimenta dificultades de salud mental, consulte a un profesional calificado.
            </li>
            <li>
              Todas las conversaciones entre los usuarios y los Compañeros de IA son
              completamente <strong>ficticias</strong>. Los personajes de IA no poseen emociones,
              intenciones ni capacidad para cumplir promesas en el mundo real.
            </li>
            <li>
              El contenido generado por IA puede, en ocasiones, ser <strong>inexacto o incompleto</strong>.
              Los usuarios son responsables de evaluar la idoneidad de la información proporcionada.
            </li>
          </ul>
        </div>

        {/* Section 1 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.sectionNumber} style={{ color: BRAND_COLOR }}>1.</span>
            Descripción del Servicio
          </h2>
          <p>
            Polola.AI es un servicio de compañía virtual impulsado por inteligencia artificial,
            disponible bajo modalidad de suscripción mensual. Permite al usuario mantener
            conversaciones personalizadas con personajes de IA a través de mensajería de texto
            y diversas funciones multimedia.
          </p>
          <p>
            El Servicio está disponible exclusivamente para clientes del operador móvil Entel,
            tanto en modalidad postpago como prepago. El acceso a funciones avanzadas y contenido
            premium puede requerir el uso de tokens, según se detalla en estos T&C.
          </p>
        </section>

        {/* Section 2 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.sectionNumber} style={{ color: BRAND_COLOR }}>2.</span>
            Acceso al Servicio
          </h2>
          <p>
            El usuario podrá suscribirse al Servicio a través de nuestra landing page de
            suscripción con doble opt-in, donde deberá confirmar su suscripción siguiendo las
            instrucciones indicadas en pantalla. Una vez completado el proceso, será redirigido
            de forma inmediata al portal de contenido.
          </p>
          <p>
            Los usuarios suscritos podrán acceder al portal en cualquier momento a través de la
            URL contenida en el SMS de bienvenida enviado por el operador móvil Entel, o
            directamente mediante los canales habilitados por Polola.AI.
          </p>
          <p>
            La cuenta es personal e intransferible. El usuario es el único responsable de todas
            las actividades realizadas con sus credenciales de acceso.
          </p>
        </section>

        {/* Section 3 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.sectionNumber} style={{ color: BRAND_COLOR }}>3.</span>
            Condiciones del Servicio
          </h2>
          <p>
            Al suscribirse al Servicio, el usuario acepta los presentes T&C en su totalidad.
            El Servicio puede ser utilizado por clientes postpago, prepago y cuenta controlada
            de los operadores móviles habilitados.
          </p>
          <p>
            El tráfico de datos asociado a la utilización del Servicio será descontado del plan
            de datos del usuario o cobrado según las tarifas vigentes de su operador. El usuario
            acepta recibir mensajes relacionados con el Servicio, incluyendo notificaciones,
            promociones y nuevos contenidos.
          </p>
          <p>
            Nuestros servicios están destinados únicamente para uso personal y no comercial. El
            usuario se compromete a no utilizar el Servicio para ningún fin comercial, ilegal o
            no autorizado.
          </p>
        </section>

        {/* Section 4 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.sectionNumber} style={{ color: BRAND_COLOR }}>4.</span>
            Tarifas, Planes y Duración
          </h2>

          <h3 className={styles.subsectionTitle}>4.1 Planes de Suscripción Mensual</h3>
          <p>Polola.AI ofrece los siguientes planes de suscripción mensual:</p>
          <div className={styles.planCard} style={{ borderLeftColor: BRAND_COLOR }}>
            <strong>Plan Postpago:</strong> $4.990 CLP (IVA incluido) con renovación mensual
            automática. Da acceso completo al Servicio, incluyendo mensajería ilimitada con el
            Compañero de IA y una cantidad mensual de tokens según el plan contratado.
          </div>
          <div className={styles.planCard} style={{ borderLeftColor: BRAND_COLOR }}>
            <strong>Plan Prepago:</strong> $1.200 CLP (IVA incluido) con renovación mensual
            automática sujeta a disponibilidad de saldo. Da acceso al Servicio durante el período
            contratado.
          </div>
          <p>
            El valor de la suscripción se cargará automáticamente a la boleta Entel en el caso de
            clientes postpago/cuenta controlada, y se descontará del saldo disponible en la línea
            Entel en el caso de clientes prepago.
          </p>

          <h3 className={styles.subsectionTitle}>4.2 Tokens</h3>
          <p>
            Los tokens son la unidad de valor interna del Servicio que permite al usuario acceder
            a funciones adicionales y contenido premium, tales como:
          </p>
          <div className={styles.tokenFeatures}>
            <div className={styles.tokenFeature}>Generación de imágenes personalizadas con el Compañero de IA.</div>
            <div className={styles.tokenFeature}>Notas de voz y contenido de audio.</div>
            <div className={styles.tokenFeature}>Contenido multimedia exclusivo bajo demanda.</div>
            <div className={styles.tokenFeature}>Funciones especiales o interacciones avanzadas con el Compañero de IA.</div>
          </div>
          <p>
            Cada plan de suscripción mensual incluye una cantidad de tokens que se indicará al
            momento de la contratación. Los tokens adicionales pueden adquirirse por separado según
            la tabla de precios vigente publicada en el portal del Servicio.
          </p>
          <p>
            Los tokens no son transferibles entre usuarios ni cuentas, no son canjeables por dinero
            en efectivo y no pueden utilizarse para liquidar pagos de suscripción pendientes. Los
            tokens incluidos en cada ciclo de facturación caducan al término del período mensual y
            no se acumulan ni transfieren al siguiente período.
          </p>

          <h3 className={styles.subsectionTitle}>4.3 Compra de Tokens Adicionales</h3>
          <p>
            El usuario puede adquirir paquetes de tokens adicionales en cualquier momento a través
            del portal del Servicio. El cobro se realizará de forma inmediata según el método de pago
            registrado. Los tokens adicionales adquiridos fuera de la suscripción deben ser utilizados
            antes del cierre de la cuenta o cancelación del Servicio, ya que no serán reembolsados ni
            transferidos. Para clientes Entel, el cobro se realizará con cargo a su boleta Entel.
          </p>
        </section>

        {/* Section 5 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.sectionNumber} style={{ color: BRAND_COLOR }}>5.</span>
            Renovación de la Suscripción
          </h2>
          <p>
            Las suscripciones se renuevan automáticamente al finalizar cada período de la suscripción
            (mensual o semanal), al precio indicado al momento de la contratación. El cobro se
            procesará automáticamente al inicio de cada nuevo período.
          </p>
          <p>
            En el caso de clientes prepago y cuenta controlada, si no es posible realizar la renovación
            por saldo insuficiente, se realizarán reintentos durante los 5 días siguientes. Si
            transcurridos hasta 60 días desde el vencimiento no ha sido posible renovar, el usuario
            quedará desuscrito automáticamente, perdiendo el acceso al Servicio y los tokens no utilizados.
          </p>
          <p>
            El usuario podrá volver a suscribirse en cualquier momento siguiendo las instrucciones
            indicadas en la sección 2 de estos T&C.
          </p>
        </section>

        {/* Section 6 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.sectionNumber} style={{ color: BRAND_COLOR }}>6.</span>
            Información y Desuscripción
          </h2>
          <p>
            El usuario podrá consultar los detalles de su suscripción, incluyendo plan contratado,
            fecha de vencimiento, tokens disponibles y otras opciones de cuenta, en la sección
            &quot;Mi Cuenta&quot; del portal del Servicio.
          </p>
          <p>
            El usuario puede cancelar su suscripción en cualquier momento desde la sección
            Mi Cuenta / Cancelar suscripción. Una vez cancelada, la suscripción permanecerá activa
            hasta el final del período de facturación actual, sin cargos adicionales. Al vencer el
            período, el acceso pasará a versión gratuita (si aplica) o se suspenderá, y los tokens
            no utilizados caducarán.
          </p>
          <p>
            También puede solicitar la desuscripción enviando la palabra <strong>SALIR</strong> al
            número habilitado por el operador, o contactando al soporte del Servicio.
          </p>
        </section>

        {/* Section 7 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.sectionNumber} style={{ color: BRAND_COLOR }}>7.</span>
            Conducta del Usuario y Restricciones de Contenido
          </h2>
          <p>Al acceder y utilizar el Servicio, el usuario se compromete a:</p>
          <div className={styles.restrictionsList}>
            <div className={styles.restrictionItem}>No modificar, adaptar ni intentar acceder al código fuente o estructura del Servicio.</div>
            <div className={styles.restrictionItem}>No eludir ni interferir con las funciones de seguridad del Servicio.</div>
            <div className={styles.restrictionItem}>No utilizar el Servicio para obtener acceso no autorizado a sistemas o redes de terceros.</div>
            <div className={styles.restrictionItem}>No utilizar el Servicio para fines ilícitos, ofensivos o que puedan causar daño.</div>
            <div className={styles.restrictionItem}>No eliminar ni modificar avisos de derechos de autor u otros avisos de propiedad intelectual.</div>
            <div className={styles.restrictionItem}>Cumplir con todas las leyes aplicables en su jurisdicción.</div>
          </div>
          <p>
            El Servicio cuenta con controles de moderación de contenido. Cualquier contenido que
            infrinja estas políticas puede ser eliminado y la cuenta del usuario puede ser suspendida
            o cancelada.
          </p>
          <p className={styles.zeroTolerance} style={{ borderColor: BRAND_COLOR }}>
            Tenemos política de <strong>tolerancia cero</strong> ante cualquier forma de contenido
            ilegal, incluyendo material de abuso sexual infantil. Dichas infracciones serán denunciadas
            a las autoridades competentes.
          </p>
        </section>

        {/* Section 9 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.sectionNumber} style={{ color: BRAND_COLOR }}>9.</span>
            Derechos del Proveedor
          </h2>
          <p>
            El Servicio se proporciona en el estado en que se encuentra y según su disponibilidad.
            El proveedor no garantiza que el Servicio esté libre de errores o interrupciones, ni que
            el contenido generado por inteligencia artificial sea exacto, original o se ajuste
            plenamente a las expectativas del usuario.
          </p>
          <p>
            El proveedor no será responsable por daños directos, indirectos, especiales, incidentales
            o consecuentes derivados del uso o la imposibilidad de uso del Servicio, incluyendo pérdida
            de datos, vencimiento de tokens por fallas técnicas ajenas al control razonable del
            proveedor, o decisiones adoptadas por el usuario a partir de sus interacciones con los
            Compañeros de IA.
          </p>
          <p>
            El proveedor se reserva el derecho de modificar, agregar o eliminar contenidos, funciones
            y personajes de IA en cualquier momento y sin previo aviso, así como de ajustar las tarifas
            del Servicio, informando al usuario con la debida anticipación.
          </p>
          <p>
            El proveedor se reserva el derecho de interpretar soberanamente los presentes Términos y
            Condiciones, lo cual los usuarios aceptan por el solo hecho de suscribirse al Servicio.
            La suscripción implica el conocimiento y la aceptación íntegra de estos T&C. Cualquier
            infracción a los mismos, o a los procedimientos y sistemas establecidos para la correcta
            utilización del Servicio, facultará al proveedor para excluir al usuario de forma inmediata.
          </p>
        </section>

        {/* Section 10 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.sectionNumber} style={{ color: BRAND_COLOR }}>10.</span>
            Propiedad Intelectual
          </h2>
          <p>
            Todos los derechos de propiedad intelectual asociados al Servicio Polola.AI, incluyendo
            los personajes de IA, diseño de plataforma, logotipos, software y tecnología, son propiedad
            exclusiva del proveedor o sus licenciantes. Se prohíbe a los usuarios reproducir, modificar,
            distribuir o explotar comercialmente cualquier elemento del Servicio sin autorización expresa.
          </p>
          <p>
            El usuario conserva sus derechos sobre el contenido que ingrese al Servicio (mensajes,
            preferencias, etc.), pero otorga al proveedor una licencia no exclusiva, mundial y libre de
            regalías para utilizar dicho contenido con el fin de operar, mejorar y personalizar el
            Servicio, de conformidad con la Política de Privacidad aplicable.
          </p>
        </section>

        {/* Section 11 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.sectionNumber} style={{ color: BRAND_COLOR }}>11.</span>
            Tipo de Cliente y Modalidad de Cobro
          </h2>
          <p>
            Polola.AI opera exclusivamente a través del operador móvil Entel. Tanto el cobro de la
            suscripción semanal/mensual como la adquisición de tokens adicionales se realizarán con
            cargo a la boleta Entel, según la modalidad del cliente:
          </p>
          <div className={styles.planCard} style={{ borderLeftColor: BRAND_COLOR }}>
            <strong>Clientes Postpago y Cuenta Controlada:</strong> el cobro se realizará con cargo
            a la boleta Entel del mes correspondiente.
          </div>
          <div className={styles.planCard} style={{ borderLeftColor: BRAND_COLOR }}>
            <strong>Clientes Prepago:</strong> el cobro se realizará contra el saldo disponible en
            la línea Entel del cliente.
          </div>
        </section>

        {/* Section 12 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.sectionNumber} style={{ color: BRAND_COLOR }}>12.</span>
            Modificación de los Términos
          </h2>
          <p>
            El proveedor se reserva el derecho de actualizar o modificar estos T&C en cualquier
            momento. Los cambios serán notificados a través del portal del Servicio o mediante mensaje
            de texto, y entrarán en vigor desde su publicación. El uso continuado del Servicio tras la
            publicación de cambios implica la aceptación de los nuevos términos.
          </p>
          <p>
            El proveedor se reserva el derecho de interpretar soberanamente los presentes T&C. La
            participación en el Servicio implica el conocimiento y aceptación de estas condiciones.
          </p>
        </section>

        {/* Section 13 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.sectionNumber} style={{ color: BRAND_COLOR }}>13.</span>
            Legislación Aplicable y Jurisdicción
          </h2>
          <p>
            Estos Términos y Condiciones se rigen e interpretan de conformidad con las leyes de la
            República de Chile. Para cualquier disputa derivada del uso del Servicio, las partes se
            someten a la jurisdicción exclusiva de los tribunales competentes de la ciudad de Santiago
            de Chile.
          </p>
          <p>
            Para consultas, soporte técnico o solicitudes de desuscripción, puede contactarnos a
            través del portal del Servicio o escribiéndonos directamente al correo{" "}
            <a href="mailto:contacto@polola.ai" className={styles.emailLink} style={{ color: BRAND_COLOR }}>
              contacto@polola.ai
            </a>
          </p>
        </section>

        <footer className={styles.footer}>
          <div className={styles.footerAccent} style={{ background: BRAND_COLOR }} />
          <p>© {new Date().getFullYear()} Polola.AI — Todos los derechos reservados.</p>
        </footer>
      </div>
    </div>
  );
}