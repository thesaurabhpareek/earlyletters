/**
 * Opts a page out of the cross-document view transition. Pages reached by a form post and a redirect
 * (unsubscribe, the plain sign-up answers) are not a "page turn", and the browser aborts a transition across
 * a post redirect with an unhandled error. Those pages simply appear.
 */
export function NoViewTransition() {
  return <style dangerouslySetInnerHTML={{ __html: '@view-transition{navigation:none}' }} />;
}
