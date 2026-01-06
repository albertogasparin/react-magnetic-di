use crate::transform::TransformVisitor;
use swc_core::ecma::{ast::*, visit::visit_mut_pass};
use swc_core::plugin::{plugin_transform, proxies::TransformPluginProgramMetadata};

pub mod tests;
pub mod transform;

/// entrypoint for build, exported as wasm
#[plugin_transform]
pub fn process_transform(program: Program, _metadata: TransformPluginProgramMetadata) -> Program {
    program.apply(visit_mut_pass(TransformVisitor))
}
