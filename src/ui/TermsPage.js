/**
 * TermsPage.js — Términos y condiciones y política de tratamiento de datos.
 */

import { el } from '../utils/helpers.js';

export function TermsPage() {
  return el('section', { class: 'view legal' }, [
    el('div', { class: 'view__head' }, [
      el('p', { class: 'legal__kicker' }, 'Documento legal'),
      el('h1', {}, 'Términos y condiciones y política de datos'),
      el('p', { class: 'muted' }, 'Tunning Motorcol · Última actualización: 16 de noviembre de 2026.'),
    ]),
    el('article', { class: 'legal__doc panel' }, [
      section('1. Identificación y objeto', [
        'Tunning Motorcol es una plataforma web académica de visualización, personalización 3D y solicitud de cotización de vehículos. El presente documento regula el acceso y uso del sitio, la creación de cuentas y el tratamiento de datos personales.',
        'Al marcar la casilla de aceptación y crear una cuenta, el usuario declara haber leído, comprendido y aceptado estas condiciones. Si no está de acuerdo, deberá abstenerse de registrarse y de utilizar las funciones que requieren autenticación.',
      ]),
      section('2. Naturaleza del servicio', [
        'La plataforma permite explorar un catálogo ilustrativo, configurar acabados y piezas en un entorno tridimensional, guardar diseños y remitir solicitudes de cotización. Los vehículos, precios, piezas y tiempos mostrados tienen carácter demostrativo e informativo.',
        'Tunning Motorcol no constituye un establecimiento de comercio automotor, no realiza venta directa de vehículos ni garantiza disponibilidad de inventario, homologación, financiación o entrega. Las cotizaciones no son ofertas vinculantes hasta que un asesor o fabricante las confirme por un canal oficial.',
      ]),
      section('3. Elegibilidad y cuenta', [
        'El registro está destinado a personas mayores de dieciocho (18) años, con domicilio o interés comercial en Colombia, que suministren información veraz, completa y actualizada.',
        'El usuario es responsable de la confidencialidad de su correo y contraseña, y de toda actividad realizada desde su cuenta. Debe notificar de inmediato cualquier uso no autorizado. Tunning Motorcol podrá suspender o cancelar cuentas cuando exista incumplimiento de estas condiciones, datos falsos o riesgo para la seguridad del servicio.',
      ]),
      section('4. Configuraciones, precios y cotizaciones', [
        'Los precios se expresan en pesos colombianos (COP) y corresponden a estimaciones de prototipo. Pueden variar por actualizaciones de catálogo, impuestos, fletes, instalación u otros conceptos no incluidos en el visor.',
        'Al guardar una configuración o enviar una solicitud, el usuario autoriza el registro del diseño, del valor estimado y del mensaje asociado, con el fin de dar trámite comercial o académico a la petición. El envío de una solicitud no genera obligación de contratar para ninguna de las partes.',
      ]),
      section('5. Propiedad intelectual', [
        'La marca, la interfaz, el código, los textos y las piezas de personalización de diseño propio pertenecen a Tunning Motorcol o se usan bajo licencia. Los modelos 3D de vehículos y el entorno de garaje son obras de terceros, atribuidas en el pie de página del sitio, y se emplean conforme a las licencias Creative Commons indicadas.',
        'Queda prohibido copiar, extraer, redistribuir o explotar comercialmente los modelos, texturas o el software de la plataforma sin autorización de sus titulares, salvo los usos permitidos por la licencia aplicable o por la ley.',
      ]),
      section('6. Uso aceptable', [
        'El usuario se obliga a utilizar el sitio de forma lícita, a no intentar acceder a sistemas, cuentas o datos ajenos, a no alterar el funcionamiento del configurador y a no emplear la plataforma para envío masivo de mensajes, fraude o suplantación.',
        'El incumplimiento podrá dar lugar a la terminación de la cuenta y a las acciones legales pertinentes.',
      ]),
      section('7. Política de tratamiento de datos personales', [
        'Responsable: Tunning Motorcol, con atención en Carrera 7 # 72-10, Bogotá D.C., Colombia, y correo hola@tunningmotorcol.co.',
        'Datos que se recogen: nombre completo, correo electrónico, número de celular, ciudad, departamento, autorización de comunicaciones comerciales, configuraciones guardadas, solicitudes de cotización y datos técnicos de sesión necesarios para el funcionamiento del servicio.',
        'Finalidades: crear y administrar la cuenta; prestar el configurador 3D; calcular y conservar cotizaciones; contactar al usuario respecto de sus solicitudes; mejorar la plataforma; cumplir obligaciones legales; y, solo si el usuario lo autoriza de forma opcional, enviar información comercial.',
        'El tratamiento se rige por la Ley 1581 de 2012, el Decreto 1377 de 2013 y demás normas colombianas de habeas data. El titular puede conocer, actualizar, rectificar y suprimir sus datos, y revocar la autorización, escribiendo a hola@tunningmotorcol.co o desde la sección «Mi perfil», cuando esta se encuentre habilitada.',
        'La información se almacena en servicios de autenticación y base de datos en la nube (Supabase). No se vende a terceros. Podrá compartirse con el personal que gestione las cotizaciones, con proveedores estrictamente necesarios para operar la plataforma y con autoridades cuando la ley lo exija.',
      ]),
      section('8. Cookies y almacenamiento local', [
        'El sitio puede guardar en el navegador datos de sesión, preferencias de interfaz (por ejemplo, paneles ocultos) y un resumen local del usuario autenticado, con el único fin de mantener la experiencia y la seguridad de la cuenta. El usuario puede borrar estos datos desde la configuración de su navegador; ello puede exigir un nuevo inicio de sesión.',
      ]),
      section('9. Limitación de responsabilidad', [
        'El servicio se ofrece «tal como está», en el marco de un prototipo académico. Tunning Motorcol no garantiza disponibilidad ininterrumpida, ausencia de errores en los modelos 3D ni exactitud absoluta de precios o especificaciones.',
        'En la máxima medida permitida por la ley colombiana, no se responde por daños indirectos, lucro cesante o pérdidas derivadas del uso o la imposibilidad de uso de la plataforma, salvo dolo o culpa grave.',
      ]),
      section('10. Modificaciones y ley aplicable', [
        'Estos términos podrán actualizarse. La versión vigente se publicará en esta página con su fecha. El uso posterior al cambio implica aceptación, salvo cuando la ley exija un consentimiento expreso adicional para el tratamiento de datos.',
        'El presente documento se rige por las leyes de la República de Colombia. Cualquier controversia se someterá a los jueces de Bogotá D.C., sin perjuicio de los derechos irrenunciables del consumidor.',
      ]),
      section('11. Contacto', [
        'Para consultas sobre estos términos, el tratamiento de datos o una cotización: hola@tunningmotorcol.co · +57 601 123 4567 · Carrera 7 # 72-10, Bogotá D.C., Colombia.',
      ]),
      el('p', { class: 'legal__close muted' }, 'Al aceptar, el usuario confirma que la información suministrada es veraz y que autoriza el tratamiento de sus datos para las finalidades descritas.'),
    ]),
    el('p', { class: 'legal__back' }, [
      el('a', { class: 'btn btn--primary', href: '#/' }, 'Volver al inicio'),
    ]),
  ]);
}

function section(title, paragraphs) {
  return el('section', { class: 'legal__section' }, [
    el('h2', {}, title),
    ...paragraphs.map((t) => el('p', {}, t)),
  ]);
}
