#pragma once

namespace sead {
/* [1.5.0][link-func] symbol=_ZN4sead10TextWriter6printfEPKcz, uking_name=sead::TextWriter::printf */
class TextWriter;
}

namespace uking::studio::screen {


void Init();
void Compute();
void Render(sead::TextWriter*);
}