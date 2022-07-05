/*@jsxRuntime automatic @jsxImportSource react*/
import CustomWrapperName from '@dummy/import';
function _createMdxContent(props) {
  return <><CustomWrapperName></CustomWrapperName></>;
}
function MDXContent(props = {}) {
  const {wrapper: MDXLayout} = props.components || ({});
  return MDXLayout ? <MDXLayout {...props}><_createMdxContent {...props} /></MDXLayout> : _createMdxContent(props);
}
export default MDXContent;
