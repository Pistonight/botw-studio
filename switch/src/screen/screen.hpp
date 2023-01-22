#pragma once

namespace sead {
/* [1.5.0][link-func] symbol=_ZN4sead10TextWriter6printfEPKcz, uking_name=sead::TextWriter::printf */
class TextWriter;
}

namespace botwgametools::screen {


void Init();
void Compute();
void Render(sead::TextWriter*);
}