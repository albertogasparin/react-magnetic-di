use crate::TransformVisitor;
use std::path::PathBuf;
use swc_common::Mark;
use swc_core::ecma::visit::visit_mut_pass;
use swc_ecma_parser::{EsSyntax, Syntax};
use swc_ecma_transforms_base::resolver;
use swc_ecma_transforms_testing::{test_fixture, FixtureTestConfig};

fn syntax() -> Syntax {
    Syntax::Es(EsSyntax {
        jsx: true,
        ..Default::default()
    })
}

#[testing::fixture("src/tests/fixtures/**/input.js")]
fn fixture(input: PathBuf) {
    let output = input.parent().unwrap().join("output.js");
    test_fixture(
        syntax(),
        &|_t| {
            let unresolved_mark = Mark::new();
            let top_level_mark = Mark::new();
            // TODO - see if we can run through JSX first.
            // This is what the babel tests do.
            // reference the emotion plugin - https://github.com/swc-project/plugins/blob/main/packages/emotion/transform/tests/fixture.rs#L25
            (
                resolver(unresolved_mark, top_level_mark, false),
                visit_mut_pass(TransformVisitor),
            )
        },
        &input,
        &output,
        FixtureTestConfig {
            ..Default::default()
        },
    );
}
